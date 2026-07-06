import os
import re

file_path = 'frontend/src/pages/SettingsPage.tsx'
out_dir = 'frontend/src/pages/Settings'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Read the imports
imports_match = re.search(r'^(.*?)\nconst settingsSections', content, re.DOTALL)
imports_str = imports_match.group(1) if imports_match else ''

# Extract sections
sections = [
    ('AccountSettings', '{/* Account Settings */}'),
    ('Notifications', '{/* Notifications */}'),
    ('AlertThresholds', '{/* Alert Thresholds */}'),
    ('Security', '{/* Security */}'),
    ('DataManagement', '{/* Data Management */}'),
    ('Appearance', '{/* Appearance */}'),
    ('System', '{/* System */}')
]

components = {}

def get_block(content, start_marker, end_marker):
    start = content.find(start_marker)
    if start == -1: return ""
    if end_marker:
        end = content.find(end_marker, start)
        return content[start:end]
    else:
        end = content.rfind('        </div>\n      </div>\n    </main>')
        return content[start:end]

for i in range(len(sections)):
    name, marker = sections[i]
    next_marker = sections[i+1][1] if i + 1 < len(sections) else None
    block = get_block(content, marker, next_marker)
    components[name] = block

# Write each component
for name, block in components.items():
    # Strip the condition `          {activeSection === '...' && (\n`
    # and the trailing `          )}\n`
    # We will use regex to find the first `<div` and extract everything inside the condition
    
    match = re.search(r'\{\s*activeSection\s*===\s*\'[^\']+\'\s*&&\s*\(\s*(<div.*)\s*\)\s*\}', block, re.DOTALL)
    if match:
        jsx = match.group(1)
        
        # add indentation to match standard format later
        comp_str = f"""import React, {{ useState }} from 'react';
import {{ Save, Trash2, Download, Key, Mail, Phone, MapPin, AlertCircle }} from 'lucide-react';
import {{ toast }} from 'sonner';
import {{
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}} from '../../components/ui/alert-dialog';

export function {name}({{ savingSection, handleSave, ...props }}: any) {{
  return (
    {jsx}
  );
}}
"""
        with open(os.path.join(out_dir, f'{name}.tsx'), 'w', encoding='utf-8') as f:
            f.write(comp_str)
