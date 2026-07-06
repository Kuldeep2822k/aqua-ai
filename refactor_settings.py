import os
import re

file_path = 'frontend/src/pages/SettingsPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

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

# Get everything before SettingsPage
start_of_comp = content.find('export function SettingsPage')
before_comp = content[:start_of_comp]

# Get the body of SettingsPage before the first section
first_section_start = content.find(sections[0][1])
comp_body = content[start_of_comp:first_section_start]

# Get the end of SettingsPage
last_section_end = content.rfind('        </div>\n      </div>\n    </main>')
comp_end = content[last_section_end:]

# Replace the sections inside comp_body with component calls
new_render = """          {activeSection === 'account' && <AccountSettings savingSection={savingSection} handleSave={handleSave} />}
          {activeSection === 'notifications' && <NotificationSettings notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} savingSection={savingSection} handleSave={handleSave} />}
          {activeSection === 'thresholds' && <AlertThresholds savingSection={savingSection} handleSave={handleSave} />}
          {activeSection === 'security' && <Security savingSection={savingSection} handleSave={handleSave} />}
          {activeSection === 'data' && <DataManagement isDeleting={isDeleting} setIsDeleting={setIsDeleting} />}
          {activeSection === 'appearance' && <Appearance theme={theme} onThemeChange={onThemeChange} accentIndex={accentIndex} setAccentIndex={setAccentIndex} savingSection={savingSection} handleSave={handleSave} />}
          {activeSection === 'system' && <System savingSection={savingSection} handleSave={handleSave} />}
"""

# Generate the component definitions
comp_defs = ""
for name, block in components.items():
    match = re.search(r'\{\s*activeSection\s*===\s*\'[^\']+\'\s*&&\s*\(\s*(<div.*)\s*\)\s*\}', block, re.DOTALL)
    if match:
        jsx = match.group(1)
        # Fix missing variables in Security
        if name == 'Security':
            jsx = """
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const handleDeleteAccount = () => {
    setIsDeletingAccount(true);
    setTimeout(() => {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
    }, 2000);
  };
""" + "  return (\n" + jsx + "\n  );"
        # Fix missing variables in Appearance
        elif name == 'Appearance':
            jsx = """
  const [density, setDensity] = React.useState('comfortable');
""" + "  return (\n" + jsx + "\n  );"
        else:
            jsx = "  return (\n" + jsx + "\n  );"
        
        # Determine props
        props_str = "({ savingSection, handleSave }: any)"
        if name == 'Notifications':
            props_str = "({ notificationSettings, setNotificationSettings, savingSection, handleSave }: any)"
        elif name == 'DataManagement':
            props_str = "({ isDeleting, setIsDeleting }: any)"
        elif name == 'Appearance':
            props_str = "({ theme, onThemeChange, accentIndex, setAccentIndex, savingSection, handleSave }: any)"
            
        comp_defs += f"function {name}{props_str} {{\n{jsx}\n}}\n\n"

# Remove the missing state variables from SettingsPage
comp_body = re.sub(r'const \[showDeleteDialog.*?\n', '', comp_body)
comp_body = re.sub(r'const \[isDeletingAccount.*?\n', '', comp_body)
comp_body = re.sub(r'const \[density.*?\n', '', comp_body)
comp_body = re.sub(r'const handleDeleteAccount.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n  };\n', '', comp_body)


# Assemble
new_content = before_comp + "\n" + comp_defs + comp_body + new_render + comp_end

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
