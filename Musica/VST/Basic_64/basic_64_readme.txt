basic 64
www.delamancha.co.uk

-------------------------------------------------------
User License Agreement
-------------------------------------------------------

This Software is copyright © 2007 de la Mancha. The Software is not public domain, and is protected by the copyright laws of the UK and reciprocal laws of the international community. In downloading the Software, you are not obtaining title to the Software or any copyrights. You may not sublicense, rent, lease, convey, distribute, copy, modify, translate, convert to another programming language, decompile, or disassemble the Software for any purpose. You may only redistribute the Software with the Authors prior written permission. Where redistribution is authorised in writing by the Author, the Software must be redistributed in its original archive format, and must not be modified in any way. All such authorised redistribution must be accompanied by clear messages stating the origin of the software as a product by the Author, this license, a link to the Website, and a further message saying that updates of the Software are available from the Website.
By using the Software, you are agreeing to this disclaimer and license

-----------------------------------------------------------------------------------


basic64 is inspired by the 8 bit sounds of the classic Commodore 64.
It's not a straight emulation, but is based around the SID chip with some extras for that 8-bit retro game sound, lofi gritty noises or just plain oddness

features
- 16, 8 or 6 bit sound quality
- 3 oscs, each with their own ADSR envelope
- oscillators can be sync'd and ring modulated
- pitch envelope
- pitch wobble option, for subtle instability
- 2 tempo-sync LFO's which modulate pitch, cut-off and pulse width
- LFO's have attack/release curves
- tempo-sync arpegiator
- flexible routing to state variable filter (LP, HP & BP)
- envelopes can be reset or continuous at retrigger
- monophonic or polyphonic option
- midi learn / midi CC support
- 128 presets by sinkmusic & WhiskeyPriest



-------------------------------------------------

Controls
-------------------------------------------------

Basic's basics
on the right hand side, there are 4 buttons to set up the basic options of the synth
bit rate - choose from 16, 8 or 6 bit sound quality
mono/poly - monophonic has only one voice and uses less CPU, polyphonic has 3 voices, for playing chords
stable/wobble - the pitch can be made to 'wobble' simulating pitch instability
env reset/env damp - this is the behaviour of the envelopes when retriggered part way through a cycle by another note
reset - envelope attack phases starts at zero level, useful for percussion/game sounds, may cause clicking on pad type sounds
damp - envelope attack phase starts at current level, good for wafty pads


oscillators
for each oscillator, choose from saw, pulse, triangle or noise waveform
each oscillator has a volume control, detune (+/- 36 semitones), an ADSR envelope and the ability to route through / bypass the filter
When a pulse waveform is selected, a knob for pulse width appears on the GUI

envelopes
attack, decay and release are in ms, sustain is a level (0-10)

sync - this restarts the oscillator cycle in sync with another, which has a greater effect if the oscs are detuned and so have different cycle lengths
Osc 2 can be sync'd with Osc 1
Osc 3 can be sync'd with Osc 2

ring mod - this modulates the oscillator output by multiplying it with another osc output
each osc is modulated by the previous one (osc1 is modulated by osc3)

filter - this routes each oscillator to the filter independantly, so you can filter none,some or all of the oscs

pitch envelope
each osc pitch can also be modulated by an envelope, great for percussion and game sounds
the pitch knob (semitones) controls the depth of the envelope
select which oscs to modulate using the 1,2,3 buttons

State variable filter
The filter type (low pass, high pass, band pass) can be selected, and the cut off (kHz) & resonance controlled

LFO
There are 2 identical tempo-sync LFOs, which both modulate cutoff, pitch and pulse width, but can be set to different speeds and depths for complex modulation. Select which LFO to edit from the 1 & 2 buttons
choose the LFO waveform in the drop down and the LFO cycle in beats
choose the depth of modulation for the 3 parameters, cutoff (kHz), pitch (semitones) and pulse width (0-10)
the LFO has an attack/release envelope (ms) to gradually increase and decrease the LFO depth


arpeggiator
for those classic C64 game sounds
when turned on, this will arpeggiate the midi note played as per the controls
beats - how often the note will be arpeggiated, in beats
oct - octave spread of arp, 1,2,3 or 4 octaves
note - length of each arp note
S = 1/4 beat
M = 1/2 beat
L = 3/4 beat
XL = 1 beat


all knobs and slider controls have midi CC support and midi learn
- press the 'learn' button
- led will light
- tweak a GUI control
- tweak your midi controller knob/slider/button/whatever
- led will go out
- controller will now move the GUI control

- press 'reset' button to remove all learned controls



-------------------------------------------------

credits
-------

Development input and presets by sink - www.sinkmusic.com
Beta testing and additional presets by WhiskeyPriest

3rd party modules by;
Dave Haupt - www.dehaupt.com/SynthEdit/index.html
Lance Putnam - www.uweb.ucsb.edu/~ljputnam/synthedit.html
Chris Kelly - www.chriskerry.f9.co.uk/


Update history
---------------

basic 64 - complete rewrite, adds selectable waveforms, ADSR in ms, control readouts, ring mod, arpeggiator and new presets. new GUI.

1.0.4 updates the GUI to a smaller footprint. All projects/presets will still function from 1.0.3

1.0.3 released Nov 06


----------------------------------------------------------------------------------



Donations
------------
All of my plugins are freeware, so you are free to use them at no cost. However, there is a cost associated with hosting the plugins and the increased bandwidth requirements as more people download them. Any donations would help to ensure the future hosting of my plugins.

If you do wish to make a donation, please visit;
www.delamancha.co.uk/donate.htm


Keep updated
------------
You can subscribe to my newsletter to get news on updates and releases of my VST plugins;
www.delamancha.co.uk/contact.htm