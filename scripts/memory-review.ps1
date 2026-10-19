# Monthly read-only review of Claude memory files. Writes a dated report; edits nothing.
$repo = 'C:\projects\mdbintegratedlogistics'
$mem  = 'C:\Users\Owner\.claude\projects\c--projects-mdbintegratedlogistics\memory'
$out  = Join-Path $repo ('reports\memory-review-' + (Get-Date -Format 'yyyy-MM-dd') + '.md')
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
Set-Location $repo
Get-Content (Join-Path $repo 'scripts\memory-review-prompt.md') -Raw |
  & 'C:\Users\Owner\.local\bin\claude.exe' -p --add-dir $mem --allowedTools 'Read,Glob,Grep' --permission-mode dontAsk |
  Out-File -Encoding utf8 $out
