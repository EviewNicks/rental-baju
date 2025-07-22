#!/usr/bin/env python3

import sys
import json
from win10toast import ToastNotifier

def main():
    if sys.stdin.isatty():
        # Dummy data untuk testing manual
        input_data = {"tool_name": "Write"}
    else:
        input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name")
    
    # Create notification title and message based on tool name
    if tool_name == 'Bash':
        title = "Command Executed"
        message = "Terminal command completed"
    elif tool_name == 'Edit':
        title = "File Modified"
        message = "File has been edited"
    elif tool_name == 'Write':
        title = "File Created"
        message = "New file has been written"
    elif tool_name == 'Read':
        title = "File Accessed"
        message = "File has been read"
    elif tool_name == 'Grep':
        title = "Search Complete"
        message = "Text search finished"
    elif tool_name == 'Glob':
        title = "Pattern Match"
        message = "File pattern search completed"
    elif tool_name == 'WebFetch':
        title = "Web Request"
        message = "Web content fetched"
    elif tool_name == 'Task':
        title = "Task Complete"
        message = "Background task finished"
    else:
        title = "Claude Code Complete"
        message = "operation finished"
    
    toaster = ToastNotifier()
    toaster.show_toast(title, message, duration=5)

main()