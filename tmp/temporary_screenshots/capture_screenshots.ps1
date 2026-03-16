Param(
  [string]$OutputDir = ".",
  [ValidateSet('FullScreen','Window')][string]$Mode = 'FullScreen'
)

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Save-Bitmap([System.Drawing.Bitmap]$bmp, [string]$path){
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
if ($Mode -eq 'FullScreen'){
  $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($screen.X, $screen.Y, 0, 0, $bmp.Size)
  $g.Dispose()
  $out = Join-Path -Path $OutputDir -ChildPath ("screenshot_$timestamp.png")
  Save-Bitmap $bmp $out
  Write-Output "Saved: $out"
} else {
  # capture active window
  $hwnd = [System.Windows.Forms.Form]::ActiveForm
  if (-not $hwnd){
    Write-Warning "Active window not found. Fallback to full screen."
    & $PSCommandPath -OutputDir $OutputDir -Mode FullScreen
    return
  }
  $rect = $hwnd.Bounds
  $bmp = New-Object System.Drawing.Bitmap $rect.Width, $rect.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($rect.X, $rect.Y, 0, 0, $bmp.Size)
  $g.Dispose()
  $out = Join-Path -Path $OutputDir -ChildPath ("screenshot_window_$timestamp.png")
  Save-Bitmap $bmp $out
  Write-Output "Saved: $out"
}
