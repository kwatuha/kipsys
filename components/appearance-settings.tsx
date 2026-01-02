"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { AccentColorPicker } from "@/components/accent-color-picker"
import { Card, CardContent } from "@/components/ui/card"
import { CustomColorCreator } from "@/components/custom-color-creator"
import { Button } from "@/components/ui/button"
import { PaletteSuggestionButton } from "@/components/palette-suggestion-button"
import { useThemeStore } from "@/lib/stores/theme-store"
import { AccessibilityCheckerDialog } from "@/components/accessibility-checker-dialog"

export function AppearanceSettings() {
  const { accentColor } = useThemeStore()

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-medium">Theme Mode</h3>
            <p className="text-sm text-muted-foreground text-center">Switch between light and dark mode</p>
            <ModeToggle variant="outline" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-medium">Accent Color</h3>
            <p className="text-sm text-muted-foreground text-center">
              Choose an accent color for buttons, links, and interactive elements
            </p>
            <div className="flex items-center gap-2">
              <AccentColorPicker />
              <CustomColorCreator />
              <PaletteSuggestionButton baseColor={accentColor.value} />
              <AccessibilityCheckerDialog color={accentColor.value} />
            </div>
            <div className="grid grid-cols-1 gap-4 w-full max-w-md mt-4">
              <div className="flex items-center justify-between">
                <span>Current Color:</span>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: accentColor.value }} />
                  <span>{accentColor.name}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview:</p>
                <div className="p-4 border rounded-md">
                  <div className="space-y-4">
                    <Button>Primary Button</Button>
                    <div>
                      <p>
                        Text with{" "}
                        <a href="#" className="text-primary hover:underline">
                          accent links
                        </a>{" "}
                        for preview
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
