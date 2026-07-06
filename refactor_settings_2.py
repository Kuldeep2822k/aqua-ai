import re

file_path = 'frontend/src/pages/SettingsPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('function Notifications({', 'function NotificationSettings({')

# Fix showDeleteDialog, isDeletingAccount in Security
content = content.replace('function Security({ savingSection, handleSave }: any) {\n', 'function Security({ savingSection, handleSave }: any) {\n  const [showDeleteDialog, setShowDeleteDialog] = useState(false);\n  const [isDeletingAccount, setIsDeletingAccount] = useState(false);\n  const handleDeleteAccount = () => {\n    setIsDeletingAccount(true);\n    setTimeout(() => {\n      setIsDeletingAccount(false);\n      setShowDeleteDialog(false);\n    }, 2000);\n  };\n')

# Fix density in Appearance
content = content.replace('function Appearance({ theme, onThemeChange, accentIndex, setAccentIndex, savingSection, handleSave }: any) {\n', 'function Appearance({ theme, onThemeChange, accentIndex, setAccentIndex, savingSection, handleSave }: any) {\n  const [density, setDensity] = useState("comfortable");\n')

# Move accentColors out of SettingsPage
if 'const accentColors =' in content:
    content = re.sub(r'  const accentColors = \[\n.*?  \];\n', '', content, flags=re.DOTALL)
    content = 'const accentColors = [\n    { label: "Blue", className: "bg-blue-500" },\n    { label: "Purple", className: "bg-purple-500" },\n    { label: "Green", className: "bg-green-500" },\n    { label: "Red", className: "bg-red-500" },\n    { label: "Orange", className: "bg-orange-500" },\n    { label: "Teal", className: "bg-teal-500" },\n  ];\n' + content

# Fix any types for color and index
content = content.replace('(color, index)', '(color: any, index: number)')

# Fix any leftover unused destructured elements { savingSection, handleSave }
# In AccountSettings:
content = content.replace('function AccountSettings({ savingSection, handleSave }: any)', 'function AccountSettings({ savingSection, handleSave }: any)')
# In AlertThresholds:
content = content.replace('function AlertThresholds({ savingSection, handleSave }: any)', 'function AlertThresholds({ savingSection, handleSave }: any)')

# Let's remove the variables from SettingsPage completely if they exist
content = re.sub(r'  const \[showDeleteDialog.*?;\n', '', content)
content = re.sub(r'  const \[isDeletingAccount.*?;\n', '', content)
content = re.sub(r'  const \[density.*?;\n', '', content)
content = re.sub(r'  const handleDeleteAccount = \(\) => \{\n.*?  \};\n', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
