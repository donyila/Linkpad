package com.linkpad.client

import android.app.AlertDialog
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.text.InputType
import android.view.Menu
import android.view.MenuItem
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var prefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = getSharedPreferences("linkpad_prefs", Context.MODE_PRIVATE)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = WebViewClient()

        val savedUrl = prefs.getString("server_url", null)
        if (savedUrl.isNullOrBlank()) {
            promptForServerUrl(firstLaunch = true)
        } else {
            webView.loadUrl(savedUrl)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_SET_SERVER, 0, "تنظیم آدرس سرور")
        menu.add(0, MENU_RELOAD, 1, "بارگذاری مجدد")
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            MENU_SET_SERVER -> {
                promptForServerUrl(firstLaunch = false)
                true
            }
            MENU_RELOAD -> {
                webView.reload()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun promptForServerUrl(firstLaunch: Boolean) {
        val input = EditText(this)
        input.inputType = InputType.TYPE_TEXT_VARIATION_URI
        input.hint = "http://192.168.1.10:5000"
        prefs.getString("server_url", null)?.let { input.setText(it) }

        val dialog = AlertDialog.Builder(this)
            .setTitle("آدرس سرور LinkPad")
            .setMessage("همان آدرسی که در ترمینال سرور لینوکسی/ویندوزی چاپ شد را وارد کنید")
            .setView(input)
            .setCancelable(!firstLaunch)
            .setPositiveButton("اتصال") { _, _ ->
                var url = input.text.toString().trim()
                if (url.isEmpty()) {
                    Toast.makeText(this, "آدرس نمی‌تواند خالی باشد", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    url = "http://$url"
                }
                prefs.edit().putString("server_url", url).apply()
                webView.loadUrl(url)
            }

        if (!firstLaunch) {
            dialog.setNegativeButton("انصراف", null)
        }
        dialog.show()
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    companion object {
        private const val MENU_SET_SERVER = 1
        private const val MENU_RELOAD = 2
    }
}
