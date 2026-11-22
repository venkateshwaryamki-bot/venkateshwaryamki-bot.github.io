package io.github.venkateshwaryamkibot.littlestars;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Vibrator;
import android.speech.tts.TextToSpeech;
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
                tts.setSpeechRate(0.88f);
                tts.setPitch(1.15f);
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
