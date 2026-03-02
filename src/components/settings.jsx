import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { X, Save, FileText, Moon, Sun } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useSettings } from '@/hooks/useSettings'

const Settings = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully."
    })
    onClose()
  }

  const handleReset = () => {
    resetSettings()
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults."
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Settings</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Dark Mode</label>
                <p className="text-xs text-muted-foreground">
                  Toggle dark/light theme
                </p>
              </div>
              <Button
                variant={settings.isDark ? "default" : "outline"}
                size="sm"
                onClick={() => updateSettings({ isDark: !settings.isDark })}
              >
                {settings.isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Auto-save</label>
                <p className="text-xs text-muted-foreground">
                  Automatically save changes
                </p>
              </div>
              <Button
                variant={settings.autoSave ? "default" : "outline"}
                size="sm"
                onClick={() => updateSettings({ autoSave: !settings.autoSave })}
              >
                {settings.autoSave ? "On" : "Off"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Font Size</label>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <Button
                    key={size}
                    variant={settings.fontSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings({ fontSize: size })}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
