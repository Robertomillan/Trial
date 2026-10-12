package com.negociaai.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

public class SplashActivity extends Activity {
    private static final long SPLASH_MS = 1400L;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(6,31,53));
        getWindow().setNavigationBarColor(Color.rgb(6,31,53));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(6,31,53));

        LinearLayout stack = new LinearLayout(this);
        stack.setOrientation(LinearLayout.VERTICAL);
        stack.setGravity(Gravity.CENTER_HORIZONTAL);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.negocia_splash_logo);
        logo.setAdjustViewBounds(true);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);

        LinearLayout.LayoutParams logoParams =
                new LinearLayout.LayoutParams(dp(320), dp(118));
        stack.addView(logo, logoParams);

        TextView loading = new TextView(this);
        loading.setText("Carregando...");
        loading.setTextColor(Color.rgb(201,220,231));
        loading.setTextSize(14);
        loading.setGravity(Gravity.CENTER);

        LinearLayout.LayoutParams loadParams =
                new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT);
        loadParams.topMargin = dp(22);
        stack.addView(loading, loadParams);

        FrameLayout.LayoutParams stackParams =
                new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        root.addView(stack, stackParams);

        setContentView(root);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent i = new Intent(SplashActivity.this, MainActivity.class);
            startActivity(i);
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            finish();
        }, SPLASH_MS);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
