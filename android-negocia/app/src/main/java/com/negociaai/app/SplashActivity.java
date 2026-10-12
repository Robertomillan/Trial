package com.negociaai.app;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

public class SplashActivity extends Activity {
    private static final long SPLASH_MS = 1100L;
    private static final int NAVY = Color.rgb(6, 31, 53);
    private static final int TEAL = Color.rgb(56, 210, 191);
    private static final int SOFT = Color.rgb(201, 220, 231);

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(NAVY);

        LinearLayout stack = new LinearLayout(this);
        stack.setOrientation(LinearLayout.VERTICAL);
        stack.setGravity(Gravity.CENTER_HORIZONTAL);
        stack.setAlpha(0f);
        stack.setScaleX(.97f);
        stack.setScaleY(.97f);

        ImageView symbol = new ImageView(this);
        symbol.setImageResource(R.drawable.negocia_symbol);
        symbol.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        LinearLayout.LayoutParams symbolParams =
                new LinearLayout.LayoutParams(dp(116), dp(116));
        stack.addView(symbol, symbolParams);

        TextView name = new TextView(this);
        SpannableString title = new SpannableString("Negocia.AI");
        title.setSpan(new ForegroundColorSpan(TEAL), 8, 10, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        name.setText(title);
        name.setTextColor(Color.WHITE);
        name.setTextSize(34);
        name.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        name.setGravity(Gravity.CENTER);
        name.setLetterSpacing(-0.025f);
        LinearLayout.LayoutParams nameParams =
                new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT);
        nameParams.topMargin = dp(18);
        stack.addView(name, nameParams);

        TextView tagline = new TextView(this);
        tagline.setText("Estratégia, confiança e resultados.");
        tagline.setTextColor(SOFT);
        tagline.setTextSize(14);
        tagline.setTypeface(Typeface.create("sans-serif", Typeface.NORMAL));
        tagline.setGravity(Gravity.CENTER);
        tagline.setLetterSpacing(.015f);
        LinearLayout.LayoutParams taglineParams =
                new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT);
        taglineParams.topMargin = dp(4);
        stack.addView(tagline, taglineParams);

        LinearLayout dots = new LinearLayout(this);
        dots.setOrientation(LinearLayout.HORIZONTAL);
        dots.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams dotsParams =
                new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(18));
        dotsParams.topMargin = dp(30);
        stack.addView(dots, dotsParams);

        for (int i = 0; i < 3; i++) {
            View dot = new View(this);
            GradientDrawable circle = new GradientDrawable();
            circle.setShape(GradientDrawable.OVAL);
            circle.setColor(i == 1 ? Color.rgb(53, 199, 232) : TEAL);
            dot.setBackground(circle);
            dot.setAlpha(.28f);

            LinearLayout.LayoutParams dotParams =
                    new LinearLayout.LayoutParams(dp(7), dp(7));
            if (i > 0) dotParams.leftMargin = dp(8);
            dots.addView(dot, dotParams);

            ObjectAnimator pulse = ObjectAnimator.ofFloat(dot, "alpha", .28f, 1f, .28f);
            pulse.setDuration(760);
            pulse.setStartDelay(i * 135L);
            pulse.setRepeatCount(ValueAnimator.INFINITE);
            pulse.start();
        }

        FrameLayout.LayoutParams stackParams =
                new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        stackParams.leftMargin = dp(24);
        stackParams.rightMargin = dp(24);
        root.addView(stack, stackParams);

        setContentView(root);

        stack.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(330)
                .start();

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
