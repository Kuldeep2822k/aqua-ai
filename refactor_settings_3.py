import re

file_path = 'frontend/src/pages/SettingsPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Appearance complexity of 17
color_picker = """
function ColorPicker({ accentColors, accentIndex, setAccentIndex }: any) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {accentColors.map((color: any, index: number) => (
        <button
          key={color.label}
          type="button"
          aria-label={`${color.label} accent`}
          title={`${color.label} accent`}
          aria-pressed={accentIndex === index}
          onClick={() => setAccentIndex(index)}
          className={`w-full aspect-square ${color.className} rounded-xl hover:scale-110 transition-transform ${
            accentIndex === index
              ? 'ring-4 ring-blue-200 dark:ring-blue-900'
              : ''
          }`}
        ></button>
      ))}
    </div>
  );
}
"""
content = content.replace('function Appearance(', color_picker + '\nfunction Appearance(')
content = re.sub(r'<div className=\"grid grid-cols-6 gap-3\">.*?</div>', '<ColorPicker accentColors={accentColors} accentIndex={accentIndex} setAccentIndex={setAccentIndex} />', content, flags=re.DOTALL)

# Fix unused variables
content = content.replace('function Security({ savingSection, handleSave }: any)', 'function Security({ _savingSection, _handleSave }: any)')
content = content.replace('function DataManagement({ isDeleting, setIsDeleting }: any)', 'function DataManagement({ _isDeleting, _setIsDeleting }: any)')
content = content.replace('function AlertThresholds({ savingSection, handleSave }: any)', 'function AlertThresholds({ _savingSection, _handleSave }: any)')

# Remove handleDeleteAccount from SettingsPage
content = re.sub(r'  const handleDeleteAccount = \(\) => \{\n    setIsDeletingAccount\(true\);\n    setTimeout\(\(\) => \{\n      setIsDeletingAccount\(false\);\n      setShowDeleteDialog\(false\);\n    \}, 2000\);\n  \};\n', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
