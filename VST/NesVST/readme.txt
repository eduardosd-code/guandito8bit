/*=============================
/* NES VST Pack version 1.0
/* David M. Farler			
/* www.neonempyr.org
/* Released February 27. 2006
/*=============================

A group of VST plugins for Windows that emulates the NES's sound chip, the 2A03, to some degree. Getting it to sound just right will take some finesse on your end but the facilities built into the plugin should help you quite a bit, like filters and ADSR.

What's included:

NESPulse.dll 	- Square wave. 4 duty cycles available.
NESTri.dll		- Triangle wave.
NESNoise.dll	- ShiftReg+XOR based Noise generator.

Everything should be pretty straightforward on the panel.

I tried to limit some features that would limit you in the same ways as the 2A03. No arpeggiators are included, so you'll have to use another plugin or your MIDI sequencer for that. These might be included later if I have time.

Information on building these synths was based on Brad Taylor's NES Sound Documentation, which as of this release is available at:
http://nesdev.parodius.com/NESSOUND.txt

To hear how they sound, check out "Harlequin Havoc" at neonempyr.org.


====================== Known Issues ======================

NESNoise: tends to stop working unexpectedly with certain pitch+noise mode combinations. To reset, just disable and reenable. Usually adjusting the pitch slightly or changing noise modes will prevent it from happening.

NESNoise: has limits on its available pitches because the limit on the shift register's clock frequency is based on sample rate. Also, 93-bit looped metallic noise mode doesn't really sound like it should because of those same limits. It's being emulated correctly, but you're not going to get the higher-end "clangy" sounds of the true 2A03.

NESNoise: also eats up CPU. Higher pitches call for higher clock frequencies and more processing power that, as far as I know, Synthedit just can't give.