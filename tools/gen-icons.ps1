Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\extension\icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$sizes = @(16, 32, 48, 128)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 22, 15))
    $g.FillRectangle($bg, 0, 0, $size, $size)

    # dotted background grid
    $dot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 60, 50))
    $step = [Math]::Max(3, [int]($size / 10))
    for ($x = $step; $x -lt $size; $x += $step) {
        for ($y = $step; $y -lt $size; $y += $step) {
            $g.FillEllipse($dot, $x, $y, 1, 1)
        }
    }

    # tilted red bug plate
    $g.TranslateTransform($size / 2, $size / 2)
    $g.RotateTransform(-6)
    $g.TranslateTransform(-$size / 2, -$size / 2)

    $pad = $size * 0.18
    $plate = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 0, 46))
    $g.FillRectangle($plate, $pad, $pad, $size - 2 * $pad, $size - 2 * $pad)

    # bug body
    $body = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255))
    $r = $size * 0.16
    $g.FillEllipse($body, $size * 0.5 - $r, $size * 0.44 - $r, $r * 2, $r * 2)

    # eyes
    $eye = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(22, 22, 15))
    $er = [Math]::Max(1, $size * 0.035)
    $g.FillEllipse($eye, $size * 0.5 - $er - $r * 0.45, $size * 0.44 - $er - $r * 0.4, $er * 2, $er * 2)
    $g.FillEllipse($eye, $size * 0.5 + $r * 0.45 - $er, $size * 0.44 - $er - $r * 0.4, $er * 2, $er * 2)

    # antennae
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255)), ([Math]::Max(1, $size * 0.02))
    $g.DrawArc($pen, $size * 0.5 - $r, $size * 0.44 - $r * 2.2, $r, $r, 200, 110)
    $g.DrawArc($pen, $size * 0.5, $size * 0.44 - $r * 2.2, $r, $r, 230, 110)

    # legs
    for ($i = 0; $i -lt 3; $i++) {
        $y = $size * (0.5 + $i * 0.09)
        $g.DrawLine($pen, $size * 0.5 - $r * 0.75, $y, $size * 0.34, $y - $size * 0.04)
        $g.DrawLine($pen, $size * 0.5 + $r * 0.75, $y, $size * 0.66, $y - $size * 0.04)
    }

    $path = Join-Path $outDir "icon-$size.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated $path"
    $g.Dispose()
    $bmp.Dispose()
}
