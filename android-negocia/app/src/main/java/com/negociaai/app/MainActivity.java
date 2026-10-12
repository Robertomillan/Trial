package com.negociaai.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://appassets.androidplatform.net/assets/index.html";
    private static final String LOCAL_HOST = "appassets.androidplatform.net";
    private static final long MIN_SPLASH_MS = 1100L;

    private WebView webView;
    private View splashView;
    private long splashStartedAt;
    private int safeBottomPx = 0;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        splashStartedAt = System.currentTimeMillis();

        getWindow().setStatusBarColor(Color.rgb(6, 31, 53));
        getWindow().setNavigationBarColor(Color.rgb(6, 31, 53));
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        FrameLayout root = new FrameLayout(this);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVisibility(View.INVISIBLE);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

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
                super.onPageFinished(view, url);
                installAndroidKeyboardUx(view);
                applySafeAreaToWeb(view);
                hideSplashWhenReady();
            }
        });

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        splashView = createSplashView();
        root.addView(splashView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        setContentView(root);

        if (Build.VERSION.SDK_INT >= 30) {
            webView.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                safeBottomPx = bars.bottom;
                v.setPadding(bars.left, bars.top, bars.right, 0);
                applySafeAreaToWeb(webView);
                return insets;
            });
        }

        if (savedInstanceState == null) webView.loadUrl(HOME_URL);
        else {
            webView.restoreState(savedInstanceState);
            hideSplashWhenReady();
        }
    }

    private View createSplashView() {
        FrameLayout splash = new FrameLayout(this);
        splash.setBackgroundColor(Color.rgb(6, 31, 53));

        LinearLayout stack = new LinearLayout(this);
        stack.setOrientation(LinearLayout.VERTICAL);
        stack.setGravity(Gravity.CENTER_HORIZONTAL);
        stack.setPadding(40, 0, 40, 0);

        ImageView logo = new ImageView(this);
        logo.setImageResource(com.negociaai.app.R.drawable.negocia_splash_logo);
        logo.setAdjustViewBounds(true);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);

        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(118));
        stack.addView(logo, logoParams);

        TextView loading = new TextView(this);
        loading.setText("Carregando...");
        loading.setTextColor(Color.rgb(201, 220, 231));
        loading.setTextSize(14);
        loading.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams loadingParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        loadingParams.topMargin = dp(22);
        stack.addView(loading, loadingParams);

        FrameLayout.LayoutParams stackParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER);
        splash.addView(stack, stackParams);
        return splash;
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }

    private void hideSplashWhenReady() {
        if (webView == null || splashView == null) return;

        long elapsed = System.currentTimeMillis() - splashStartedAt;
        long delay = Math.max(0L, MIN_SPLASH_MS - elapsed);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (webView == null) return;
            webView.setVisibility(View.VISIBLE);
            webView.setAlpha(0f);
            webView.animate().alpha(1f).setDuration(220).start();

            if (splashView != null) {
                splashView.animate()
                        .alpha(0f)
                        .setDuration(220)
                        .withEndAction(() -> {
                            View oldSplash = splashView;
                            splashView = null;
                            if (oldSplash != null && oldSplash.getParent() instanceof FrameLayout) {
                                ((FrameLayout) oldSplash.getParent()).removeView(oldSplash);
                            }
                            getWindow().setNavigationBarColor(Color.WHITE);
                        })
                        .start();
            }
        }, delay);
    }

    private void applySafeAreaToWeb(WebView view) {
        if (view == null) return;
        String js = "document.documentElement.classList.add('android-app');"
                + "document.documentElement.style.setProperty('--android-safe-bottom','" + safeBottomPx + "px');";
        view.evaluateJavascript(js, null);
    }

    private void installAndroidKeyboardUx(WebView view) {
        String js =
            "(function(){"
            + "if(window.__negociaAndroidKeyboardFix)return;"
            + "window.__negociaAndroidKeyboardFix=true;"
            + "document.documentElement.classList.add('android-app');"
            + "var st=document.createElement('style');"
            + "st.textContent='body.android-keyboard .bottomnav,body.android-keyboard .fab{display:none!important}'"
            + "+'body.android-keyboard .app-shell{padding-bottom:16px!important;min-height:100%!important}'"
            + "+'body.android-keyboard .page{padding-bottom:48vh!important}'"
            + "+'body.android-keyboard .copilotbox{padding-bottom:28px!important}'"
            + "+'body.android-keyboard textarea,body.android-keyboard input{scroll-margin-top:120px;scroll-margin-bottom:180px}';"
            + "document.head.appendChild(st);"
            + "var maxVH=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;"
            + "function setKeyboard(open){document.body.classList.toggle('android-keyboard',!!open);}"
            + "function ensureVisible(el){setTimeout(function(){try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){el.scrollIntoView();}},260);}"
            + "document.addEventListener('focusin',function(e){"
            + "var el=e.target;if(el&&(el.matches('textarea,input,select'))){setKeyboard(true);ensureVisible(el);}"
            + "},true);"
            + "document.addEventListener('focusout',function(){setTimeout(function(){"
            + "var a=document.activeElement;if(!a||!a.matches||!a.matches('textarea,input,select')){"
            + "var vv=window.visualViewport;var open=vv&&(maxVH-vv.height>140);setKeyboard(open);"
            + "}},220);},true);"
            + "if(window.visualViewport){window.visualViewport.addEventListener('resize',function(){"
            + "var h=window.visualViewport.height;if(h>maxVH)maxVH=h;"
            + "var open=(maxVH-h)>140;setKeyboard(open);"
            + "if(open){var a=document.activeElement;if(a&&a.matches&&a.matches('textarea,input,select'))ensureVisible(a);}"
            + "});}"
            + "})();";
        view.evaluateJavascript(js, null);
    }

    @Override public void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        if (webView != null) webView.saveState(state);
    }

    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }

        webView.evaluateJavascript(
            "(function(){"
            + "try{"
            + "if(document.querySelector('.neg-detail-head')){state.route='history';render();return 'handled';}"
            + "if(typeof state==='undefined'||!state.route||state.route==='home')return 'exit';"
            + "if(state.route==='result'){state.route='copilot';render();return 'handled';}"
            + "if(state.route==='copilot'){state.route='history';render();return 'handled';}"
            + "state.route='home';render();return 'handled';"
            + "}catch(e){return 'exit';}"
            + "})()",
            response -> { if ("\"exit\"".equals(response)) finish(); }
        );
    }

    @Override public void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        splashView = null;
        super.onDestroy();
    }
}
