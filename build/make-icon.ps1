Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Drawing.Drawing2D

function New-IconPng {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $pad = [Math]::Max(2, [int]($Size * 0.03))
    $cx = [int]($Size / 2)
    $cy = [int]($Size / 2)
    $outerX = $pad
    $outerY = $pad
    $outerW = $Size - $pad * 2
    $outerH = $Size - $pad * 2
    $outerRect = New-Object System.Drawing.Rectangle([int]$outerX, [int]$outerY, [int]$outerW, [int]$outerH)

    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $outerRect,
        [System.Drawing.Color]::FromArgb(255, 255, 220, 230),
        [System.Drawing.Color]::FromArgb(255, 232, 87, 135),
        [single]125
    )
    $g.FillEllipse($gradBrush, [int]$outerX, [int]$outerY, [int]$outerW, [int]$outerH)

    # Subtle ring
    $innerPad = [int]($Size * 0.08)
    $innerX = $innerPad
    $innerY = $innerPad
    $innerW = $Size - $innerPad * 2
    $innerH = $Size - $innerPad * 2
    $ringWidth = [float]([Math]::Max(1.0, $Size * 0.015))
    $ringColor = [System.Drawing.Color]::FromArgb(90, 255, 255, 255)
    $ringPen = New-Object System.Drawing.Pen($ringColor, $ringWidth)
    $g.DrawEllipse($ringPen, [int]$innerX, [int]$innerY, [int]$innerW, [int]$innerH)

    # Paw — white beans + pad
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    # Main pad (bottom, wider ellipse)
    $padW = [int]($Size * 0.42)
    $padH = [int]($Size * 0.30)
    $padX = [int]($cx - $padW / 2)
    $padY = [int]($Size * 0.48)
    $g.FillEllipse($whiteBrush, $padX, $padY, $padW, $padH)

    # Toe beans
    $beanW = [int]($Size * 0.17)
    $beanH = [int]($Size * 0.22)

    # Outer-left (lower)
    $g.FillEllipse($whiteBrush, [int]($cx - $Size * 0.36), [int]($Size * 0.38), $beanW, $beanH)
    # Outer-right (lower)
    $g.FillEllipse($whiteBrush, [int]($cx + $Size * 0.19), [int]($Size * 0.38), $beanW, $beanH)
    # Inner-left (higher)
    $g.FillEllipse($whiteBrush, [int]($cx - $Size * 0.20), [int]($Size * 0.18), $beanW, $beanH)
    # Inner-right (higher)
    $g.FillEllipse($whiteBrush, [int]($cx + $Size * 0.03), [int]($Size * 0.18), $beanW, $beanH)

    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved $Path"
}

$outDir = $PSScriptRoot
foreach ($s in 1024, 512, 256, 128, 64, 48, 32, 16) {
    New-IconPng -Size $s -Path (Join-Path $outDir "icon-$s.png")
}
Copy-Item (Join-Path $outDir "icon-1024.png") (Join-Path $outDir "icon.png") -Force
Write-Host "Done."
