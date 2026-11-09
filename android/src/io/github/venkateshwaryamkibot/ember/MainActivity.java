package io.github.venkateshwaryamkibot.ember;

import android.app.Activity;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.OutputStream;
import java.lang.reflect.Method;
import java.nio.charset.Charset;

/** Hosts the Ember web app (bundled in assets/www) full-screen, offline. */
public class MainActivity extends Activity {
    private static final int REQ_SAVE = 11;
    private static final int REQ_OPEN = 12;
    private static final int REQ_NOTIF = 13;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingBackup;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0A0B10"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(true);

        web.addJavascriptInterface(new Bridge(), "EmberAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri u = Uri.parse(url);
                if ("file".equals(u.getScheme())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "Choose Ember backup"), REQ_OPEN);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        js("window.emberSyncFromNative && window.emberSyncFromNative(); window.checkRollover && window.checkRollover()");
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.emberBack && window.emberBack()) ? 1 : 0", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (!"1".equals(v)) MainActivity.super.onBackPressed();
            }
        });
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_OPEN) {
            if (fileCallback != null) {
                Uri[] result = null;
                if (res == RESULT_OK && data != null && data.getData() != null) result = new Uri[]{data.getData()};
                fileCallback.onReceiveValue(result);
                fileCallback = null;
            }
        } else if (req == REQ_SAVE) {
            if (res == RESULT_OK && data != null && data.getData() != null && pendingBackup != null) {
                try {
                    OutputStream os = getContentResolver().openOutputStream(data.getData());
                    os.write(pendingBackup.getBytes(Charset.forName("UTF-8")));
                    os.close();
                    toastJs("Backup saved 💾");
                } catch (Exception e) {
                    toastJs("Couldn’t save the backup");
                }
            }
            pendingBackup = null;
        }
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    private void toastJs(String msg) {
        js("window.toast && window.toast(" + quote(msg) + ")");
    }

    private static String quote(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    /** Methods callable from JavaScript as window.EmberAndroid.* */
    private class Bridge {
        @JavascriptInterface
        public void saveBackup(final String json, final String filename) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    pendingBackup = json;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("application/json");
                    i.putExtra(Intent.EXTRA_TITLE, filename);
                    try { startActivityForResult(i, REQ_SAVE); } catch (Exception e) { toastJs("No file manager found"); }
                }
            });
        }

        @JavascriptInterface
        public void setBars(final boolean light) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    int c = Color.parseColor(light ? "#F6F3EE" : "#0A0B10");
                    Window w = getWindow();
                    w.setStatusBarColor(c);
                    w.setNavigationBarColor(c);
                    web.setBackgroundColor(c);
                    View d = w.getDecorView();
                    int f = d.getSystemUiVisibility();
                    int lightFlags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | (Build.VERSION.SDK_INT >= 26 ? 0x10 : 0);
                    d.setSystemUiVisibility(light ? (f | lightFlags) : (f & ~lightFlags));
                }
            });
        }

        @JavascriptInterface
        public void setWidgetData(String json) {
            WidgetData.setFromJs(MainActivity.this, json);
            Widgets.updateAll(MainActivity.this);
        }

        @JavascriptInterface
        public String takeActions() {
            return WidgetData.takeActions(MainActivity.this);
        }

        /** Ask the launcher to place a widget (Android 8+). Returns false if unsupported. */
        @JavascriptInterface
        public boolean pinWidget(String which) {
            if (Build.VERSION.SDK_INT < 26) return false;
            try {
                AppWidgetManager m = AppWidgetManager.getInstance(MainActivity.this);
                Method supported = AppWidgetManager.class.getMethod("isRequestPinAppWidgetSupported");
                if (!(Boolean) supported.invoke(m)) return false;
                Method pin = AppWidgetManager.class.getMethod("requestPinAppWidget", ComponentName.class, Bundle.class, PendingIntent.class);
                Class<?> cls = "ring".equals(which) ? RingWidget.class : TodayWidget.class;
                return (Boolean) pin.invoke(m, new ComponentName(MainActivity.this, cls), null, null);
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void setStatus(String day, int left) {
            getSharedPreferences(ReminderReceiver.PREFS, MODE_PRIVATE).edit()
                    .putString("statusDay", day).putInt("left", left).apply();
        }

        @JavascriptInterface
        public void setReminder(final boolean on, int hour, int minute) {
            SharedPreferences p = getSharedPreferences(ReminderReceiver.PREFS, MODE_PRIVATE);
            boolean wasOn = p.getBoolean("on", false);
            p.edit().putBoolean("on", on).putInt("hour", hour).putInt("minute", minute).apply();
            ReminderReceiver.schedule(MainActivity.this);
            if (on && !wasOn && Build.VERSION.SDK_INT >= 33) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        String perm = "android.permission.POST_NOTIFICATIONS";
                        if (checkSelfPermission(perm) != PackageManager.PERMISSION_GRANTED) {
                            requestPermissions(new String[]{perm}, REQ_NOTIF);
                        }
                    }
                });
            }
        }
    }
}
