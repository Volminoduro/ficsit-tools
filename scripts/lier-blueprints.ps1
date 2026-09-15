$bp  = "$env:LOCALAPPDATA\FactoryGame\Saved\SaveGames\blueprints"
$lib = "D:\Satisfactory\BP"
New-Item -ItemType Directory -Force -Path $lib | Out-Null

Get-ChildItem $bp -Directory | Where-Object { -not $_.LinkType } | ForEach-Object {
    Copy-Item "$($_.FullName)\*" $lib -Force -ErrorAction SilentlyContinue
    Remove-Item $_.FullName -Recurse -Force
    New-Item -ItemType Junction -Path $_.FullName -Target $lib | Out-Null
    Write-Host "Lie : $($_.Name)"
}
