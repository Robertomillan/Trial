package br.com.salarioia.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
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
    private WebView webView;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
            }
        });
        setContentView(webView);
        if (Build.VERSION.SDK_INT >= 30) {
            webView.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        if (savedInstanceState == null) webView.loadUrl(HOME_URL);
        else webView.restoreState(savedInstanceState);
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
            "(function(){var active=document.querySelector('.screen.on');"
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
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
