
$speak = New-Object -ComObject SAPI.SpVoice;
$speak.Volume = 100;
[console]::Beep(440, 500);
$speak.Speak("Hello, I am Apollo Oracle. Sawasdee krub. Can you hear me?");
