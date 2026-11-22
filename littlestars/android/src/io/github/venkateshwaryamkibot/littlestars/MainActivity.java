package io.github.venkateshwaryamkibot.littlestars;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Vibrator;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;
import java.util.Set;

/**
 * Little Stars for Android: hosts the learning web app (bundled in assets/www) full-screen, offline,
 * and adds what an Android WebView can't do on its own: a friendly text-to-speech voice
 * (WebView has no speechSynthesis), haptics, and the back button stepping back one screen.
 */
public class MainActivity extends Activity {
    private WebView web;
    private TextToSpeech tts;
    private volatile boolean ttsReady;
    private Vibrator vibrator;
    private int utterance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);

        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status != TextToSpeech.SUCCESS) return;
                int r = tts.setLanguage(new Locale("en", "IN"));
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(Locale.UK);
                pickFriendlyVoice();
                tts.setSpeechRate(0.95f);
                tts.setPitch(1.45f);
                ttsReady = true;
            }
        });

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#CDEEFF"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setHapticFeedbackEnabled(true);
        setContentView(web);
        immersive();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.addJavascriptInterface(new Bridge(), "LSNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !url.startsWith("file:");   // the app never leaves its own pages
            }
        });
        web.setWebChromeClient(new WebChromeClient());   // enables confirm()/prompt() in the parent area

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/www/index.html");
    }

    /**
     * Prefer an offline, female English (India) voice - it sounds warmest for little ones.
     * Google's en-IN voices: "-x-ena" / "-x-enc" are female, "-x-end" / "-x-ene" male.
     */
    private void pickFriendlyVoice() {
        try {
            Set<Voice> all = tts.getVoices();
            if (all == null) return;
            Voice best = null;
            int bestScore = -1;
            for (Voice v : all) {
                Locale l = v.getLocale();
                if (l == null || !"en".equals(l.getLanguage())) continue;
                String n = v.getName().toLowerCase(Locale.ROOT);
                int score = 0;
                if ("IN".equals(l.getCountry())) score += 40;
                if (n.contains("-x-ena") || n.contains("-x-enc") || n.contains("female") || n.contains("-x-tpc") || n.contains("-x-sfg")) score += 30;
                if (n.contains("-x-end") || n.contains("-x-ene") || n.contains("male") && !n.contains("female")) score -= 20;
                if (!v.isNetworkConnectionRequired()) score += 15;
                if (v.getQuality() >= Voice.QUALITY_HIGH) score += 5;
                if (score > bestScore) { bestScore = score; best = v; }
            }
            if (best != null) tts.setVoice(best);
        } catch (Exception ignored) { }
    }

    @SuppressWarnings("deprecation")
    private void immersive() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }

    @Override
    protected void onPause() {
        if (tts != null) tts.stop();
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.lsBack && window.lsBack()) ? 1 : 0", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (!"1".equals(v)) MainActivity.super.onBackPressed();
            }
        });
    }

    private class Bridge {
        @JavascriptInterface
        public void speak(String text) {
            if (!ttsReady || text == null) return;
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ls" + (utterance++));
        }

        /** Speak with a voice character's pitch and speed (1.0 = normal). */
        @JavascriptInterface
        public void speakWith(String text, double pitch, double rate) {
            if (!ttsReady || text == null) return;
            tts.setPitch((float) Math.max(0.5, Math.min(2.0, pitch)));
            tts.setSpeechRate((float) Math.max(0.5, Math.min(1.5, rate)));
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ls" + (utterance++));
        }

        @JavascriptInterface
        public void stop() { if (ttsReady) tts.stop(); }

        @JavascriptInterface
        public void haptic(final int ms) {
            runOnUiThread(new Runnable() {
                @Override
                @SuppressWarnings("deprecation")
                public void run() {
                    int flags = HapticFeedbackConstants.FLAG_IGNORE_VIEW_SETTING;
                    if (ms <= 10) web.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY, flags);
                    else if (ms <= 20) web.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK, flags);
                    else if (vibrator != null && vibrator.hasVibrator()) vibrator.vibrate(Math.min(ms, 60));
                }
            });
        }
    }
}
