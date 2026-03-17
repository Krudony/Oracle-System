
$speak = New-Object -ComObject SAPI.SpVoice;
$speak.Volume = 100;
[console]::Beep(440, 500);
# พยายามใช้การสะกดแบบอังกฤษเพื่อให้ David ออกเสียงคล้ายภาษาไทยที่สุด
$speak.Speak("Sa-wad-dee krub. Pom kee Apollo Oracle. Yin-dee tee dai roo-juk krub.");
