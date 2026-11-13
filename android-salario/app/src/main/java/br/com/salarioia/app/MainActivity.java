package br.com.salarioia.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONObject;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import java.util.Collections;
import java.util.List;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://appassets.androidplatform.net/assets/index.html";
    private static final String LOCAL_HOST = "appassets.androidplatform.net";
    private static final String PRODUCT_ID = "salarioia_premium_vitalicio";
    private static final int FREE_LIMIT = 5;
    private static final String PREFS_NAME = "salarioia_entitlements_v1";
    private static final String PREFS_USES = "completed_calculations";
    private static final String PREFS_PREMIUM = "verified_premium_cached";
    private final Object useLock = new Object();
    private SharedPreferences prefs;
    private BillingClient billingClient;
    private ProductDetails premiumProduct;
    private String premiumOfferToken;
    private volatile boolean entitlementReady = false;
    private volatile boolean premiumUnlocked = false;
    private volatile String displayedPrice = "Preço no Google Play";
    private volatile String billingMessage = "Conectando ao Google Play...";
    private WebView webView;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        premiumUnlocked = prefs.getBoolean(PREFS_PREMIUM, false);
        getWindow().setStatusBarColor(Color.rgb(3, 19, 15));
        getWindow().setNavigationBarColor(Color.rgb(3, 19, 15));

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(3, 19, 15));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        webView.addJavascriptInterface(new LocalClipboard(), "SalarioAndroid");
        webView.addJavascriptInterface(new PremiumBridge(), "SalarioBilling");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (LOCAL_HOST.equals(uri.getHost()) && "https".equals(uri.getScheme())
                        && uri.getPath() != null && uri.getPath().startsWith("/assets/")) {
                    return false;
                }
                if (request.isForMainFrame() && ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (HOME_URL.equals(url)) {
                    view.evaluateJavascript(
                        "window.copyCounter=function(){if(!counterCopyText)return;"
                        + "SalarioAndroid.copy(counterCopyText);"
                        + "var b=document.querySelector('.copyCounter');"
                        + "if(b){var old=b.textContent;b.textContent='Texto copiado ✓';"
                        + "setTimeout(function(){b.textContent=old},1600)}};", null);
                }
                notifyWeb();
            }
        });
        setContentView(webView);
        connectBilling();
        if (Build.VERSION.SDK_INT >= 30) {
            webView.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        if (savedInstanceState == null) webView.loadUrl(HOME_URL);
        else webView.restoreState(savedInstanceState);
        webView.postDelayed(this::notifyWeb, 500);
    }


    private void notifyWeb() {
        if (webView == null) return;
        final int remaining = remainingFree();
        final boolean unlocked = premiumUnlocked;
        final boolean ready = entitlementReady;
        final String price = JSONObject.quote(displayedPrice);
        final String message = JSONObject.quote(billingMessage);
        webView.post(() -> {
            if (webView != null) webView.evaluateJavascript(
                "if(window.salarioBillingUpdate)window.salarioBillingUpdate("
                + remaining + "," + unlocked + "," + ready + "," + price + "," + message + ");",
                null);
        });
    }

    private int remainingFree() {
        synchronized (useLock) {
            return Math.max(0, FREE_LIMIT - prefs.getInt(PREFS_USES, 0));
        }
    }

    private class PremiumBridge {
        @JavascriptInterface public int getRemaining() { return remainingFree(); }
        @JavascriptInterface public boolean isPremium() { return premiumUnlocked; }
        @JavascriptInterface public boolean isReady() { return entitlementReady; }
        @JavascriptInterface public boolean tryUseFree() {
            if (premiumUnlocked) return true;
            synchronized (useLock) {
                int used = prefs.getInt(PREFS_USES, 0);
                if (used >= FREE_LIMIT) return false;
                // commit() is synchronous so reopening the app does not reset the count.
                if (!prefs.edit().putInt(PREFS_USES, used + 1).commit()) return false;
            }
            notifyWeb();
            return true;
        }
        @JavascriptInterface public void buyPremium() {
            runOnUiThread(() -> launchPurchase());
        }
        @JavascriptInterface public void restorePremium() {
            runOnUiThread(() -> {
                if (billingClient != null && billingClient.isReady()) queryOwnedPurchases();
                else connectBilling();
            });
        }
    }

    private void connectBilling() {
        if (billingClient != null) {
            if (billingClient.isReady()) { queryOwnedPurchases(); return; }
            billingClient.endConnection();
        }
        entitlementReady = false;
        billingMessage = "Conectando ao Google Play...";
        notifyWeb();
        billingClient = BillingClient.newBuilder(this)
            .setListener((result, purchases) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
                    for (Purchase purchase : purchases) inspectPurchase(purchase);
                    queryOwnedPurchases();
                } else if (result.getResponseCode() != BillingClient.BillingResponseCode.USER_CANCELED) {
                    billingMessage = "Compra não concluída. Código: " + result.getResponseCode();
                    notifyWeb();
                }
            })
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build();
        billingClient.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    queryOwnedPurchases();
                    queryPremiumProduct();
                } else {
                    entitlementReady = false;
                    billingMessage = "Google Play indisponível. Código: " + result.getResponseCode();
                    notifyWeb();
                }
            }
            @Override public void onBillingServiceDisconnected() {
                entitlementReady = false;
                billingMessage = "Conexão com o Google Play interrompida. Toque em Restaurar para tentar novamente.";
                notifyWeb();
            }
        });
    }

    private void queryOwnedPurchases() {
        if (billingClient == null || !billingClient.isReady()) {
            entitlementReady = false;
            billingMessage = "Aguardando conexão com o Google Play.";
            notifyWeb();
            return;
        }
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP).build();
        billingClient.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                entitlementReady = false;
                billingMessage = "Não foi possível validar compras. Tente Restaurar.";
                notifyWeb();
                return;
            }
            boolean owned = false;
            boolean pending = false;
            for (Purchase purchase : purchases) {
                if (!purchase.getProducts().contains(PRODUCT_ID)) continue;
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    owned = true;
                    inspectPurchase(purchase);
                } else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) pending = true;
            }
            premiumUnlocked = owned;
            prefs.edit().putBoolean(PREFS_PREMIUM, owned).apply();
            entitlementReady = true;
            billingMessage = owned ? "Premium vitalício ativo." :
                pending ? "Pagamento pendente. O acesso será liberado após confirmação." :
                "Você pode realizar cinco simulações gratuitas.";
            notifyWeb();
        });
    }

    private void inspectPurchase(Purchase purchase) {
        if (!purchase.getProducts().contains(PRODUCT_ID)
            || purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;
        premiumUnlocked = true;
        prefs.edit().putBoolean(PREFS_PREMIUM, true).apply();
        if (!purchase.isAcknowledged() && billingClient != null && billingClient.isReady()) {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken()).build();
            billingClient.acknowledgePurchase(params, result -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    billingMessage = "Compra identificada, mas confirmação pendente. Tente Restaurar.";
                    notifyWeb();
                }
            });
        }
    }

    private void queryPremiumProduct() {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Collections.singletonList(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(PRODUCT_ID)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()))
            .build();
        billingClient.queryProductDetailsAsync(params, (result, detailsResult) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK
                || detailsResult.getProductDetailsList().isEmpty()) {
                premiumProduct = null;
                premiumOfferToken = null;
                billingMessage = "Produto Premium não disponível. Confira o cadastro no Play Console.";
                notifyWeb();
                return;
            }
            premiumProduct = detailsResult.getProductDetailsList().get(0);
            List<ProductDetails.OneTimePurchaseOfferDetails> offers =
                premiumProduct.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) {
                premiumOfferToken = null;
                billingMessage = "Oferta de pagamento não disponível para esta conta.";
            } else {
                premiumOfferToken = offers.get(0).getOfferToken();
                displayedPrice = offers.get(0).getFormattedPrice();
            }
            notifyWeb();
        });
    }

    private void launchPurchase() {
        if (premiumUnlocked) { notifyWeb(); return; }
        if (billingClient == null || !billingClient.isReady()
            || premiumProduct == null || premiumOfferToken == null) {
            billingMessage = "Pagamento ainda não disponível. Toque em Restaurar ou tente novamente.";
            notifyWeb();
            return;
        }
        BillingFlowParams.ProductDetailsParams productParams =
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(premiumProduct)
                .setOfferToken(premiumOfferToken)
                .build();
        BillingFlowParams flow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(productParams))
            .build();
        BillingResult result = billingClient.launchBillingFlow(this, flow);
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            billingMessage = "Não foi possível iniciar a compra. Código: " + result.getResponseCode();
            notifyWeb();
        }
    }

    private class LocalClipboard {
        @JavascriptInterface public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager manager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                manager.setPrimaryClip(ClipData.newPlainText("Contraproposta Salário.IA", text));
            });
        }
    }

    @Override public void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        if (webView != null) webView.saveState(state);
    }

    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript(
            "(function(){var paywall=document.getElementById('billingPaywall');"
            + "if(paywall&&paywall.classList.contains('open')){closeBillingPaywall();return 'handled';}"
            + "var active=document.querySelector('.screen.on');"
            + "if(!active||active.id==='home')return 'exit';"
            + "if(active.id==='premiumScreen')show(lastScreen||'result');"
            + "else if(active.id==='result')show('form');else show('home');"
            + "return 'handled';})()",
            response -> { if ("\"exit\"".equals(response)) finish(); }
        );
    }

    @Override public void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("SalarioAndroid");
            webView.removeJavascriptInterface("SalarioBilling");
            webView.destroy();
            webView = null;
        }
        if (billingClient != null) {
            billingClient.endConnection();
            billingClient = null;
        }
        super.onDestroy();
    }
}
