export const templates = {
  calculator: {
    main: `package com.example.calculator

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import net.objecthunter.exp4j.ExpressionBuilder

class MainActivity : AppCompatActivity() {

    private lateinit var tvInput: TextView
    private lateinit var tvOutput: TextView
    private var lastNumeric: Boolean = false
    private var stateError: Boolean = false
    private var lastDot: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        tvInput = findViewById(R.id.tvInput)
        tvOutput = findViewById(R.id.tvOutput)
    }

    fun onDigit(view: View) {
        if (stateError) {
            tvInput.text = (view as Button).text
            stateError = false
        } else {
            tvInput.append((view as Button).text)
        }
        lastNumeric = true
    }

    fun onDecimalPoint(view: View) {
        if (lastNumeric && !stateError && !lastDot) {
            tvInput.append(".")
            lastNumeric = false
            lastDot = true
        }
    }

    fun onOperator(view: View) {
        if (lastNumeric && !stateError) {
            tvInput.append((view as Button).text)
            lastNumeric = false
            lastDot = false
        }
    }

    fun onClear(view: View) {
        this.tvInput.text = ""
        this.tvOutput.text = ""
        lastNumeric = false
        stateError = false
        lastDot = false
    }

    fun onEqual(view: View) {
        if (lastNumeric && !stateError) {
            val txt = tvInput.text.toString()
            val expression = ExpressionBuilder(txt).build()
            try {
                val result = expression.evaluate()
                tvOutput.text = result.toString()
                lastDot = true 
            } catch (ex: ArithmeticException) {
                tvOutput.text = "Error"
                stateError = true
                lastNumeric = false
            }
        }
    }
}`,
    layout: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#1E1E1E">

    <TextView
        android:id="@+id/tvInput"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:gravity="end|bottom"
        android:textColor="#FFFFFF"
        android:textSize="32sp"
        android:text="" />

    <TextView
        android:id="@+id/tvOutput"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:gravity="end|top"
        android:textColor="#AAAAAA"
        android:textSize="24sp"
        android:text="" />

    <GridLayout
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="3"
        android:columnCount="4"
        android:rowCount="5">

        <Button android:text="C" android:onClick="onClear" android:layout_columnSpan="4" android:layout_width="match_parent" />
        
        <Button android:text="7" android:onClick="onDigit" />
        <Button android:text="8" android:onClick="onDigit" />
        <Button android:text="9" android:onClick="onDigit" />
        <Button android:text="/" android:onClick="onOperator" />

        <Button android:text="4" android:onClick="onDigit" />
        <Button android:text="5" android:onClick="onDigit" />
        <Button android:text="6" android:onClick="onDigit" />
        <Button android:text="*" android:onClick="onOperator" />

        <Button android:text="1" android:onClick="onDigit" />
        <Button android:text="2" android:onClick="onDigit" />
        <Button android:text="3" android:onClick="onDigit" />
        <Button android:text="-" android:onClick="onOperator" />

        <Button android:text="." android:onClick="onDecimalPoint" />
        <Button android:text="0" android:onClick="onDigit" />
        <Button android:text="=" android:onClick="onEqual" />
        <Button android:text="+" android:onClick="onOperator" />

    </GridLayout>
</LinearLayout>`
  },
  todo: {
    main: `package com.example.todo

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ListView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var itemAdapter: ArrayAdapter<String>
    private lateinit var listView: ListView
    private lateinit var button: Button
    private lateinit var editText: EditText
    private var items = ArrayList<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        listView = findViewById(R.id.listView)
        button = findViewById(R.id.button)
        editText = findViewById(R.id.editText)

        button.setOnClickListener {
            addItem(editText.text.toString())
            editText.text.clear()
        }

        items = ArrayList()
        itemAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, items)
        listView.adapter = itemAdapter
        
        setUpListViewListener()
    }

    private fun addItem(item: String) {
        if (item.isNotEmpty()) {
            items.add(item)
            itemAdapter.notifyDataSetChanged()
        }
    }

    private fun setUpListViewListener() {
        listView.setOnItemLongClickListener { adapterView, view, i, l ->
            items.removeAt(i)
            itemAdapter.notifyDataSetChanged()
            true
        }
    }
}`,
    layout: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal">

        <EditText
            android:id="@+id/editText"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:hint="Enter task" />

        <Button
            android:id="@+id/button"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Add" />
    </LinearLayout>

    <ListView
        android:id="@+id/listView"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp" />

</LinearLayout>`
  },
  notes: {
    main: `package com.example.notes

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var editText: EditText
    private lateinit var sharedPreferences: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        editText = findViewById(R.id.editText)
        sharedPreferences = this.getSharedPreferences("com.example.notes", Context.MODE_PRIVATE)

        val savedNote = sharedPreferences.getString("note", "")
        editText.setText(savedNote)
    }

    override fun onPause() {
        super.onPause()
        val note = editText.text.toString()
        sharedPreferences.edit().putString("note", note).apply()
    }
}`,
    layout: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <EditText
        android:id="@+id/editText"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:gravity="top"
        android:hint="Type your notes here..."
        android:inputType="textMultiLine"
        android:background="@null" />

</LinearLayout>`
  }
};
