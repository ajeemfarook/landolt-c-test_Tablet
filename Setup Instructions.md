Setup Instructions
1. Install Node.js and npm
If you don’t have Node.js installed, download and install it from nodejs.org.
npm is included with Node.js.

2. Prepare the project folder
Create a folder (e.g., landolt-c-test) and inside it create a subfolder named public.
Place the three code files as shown in the file structure above.

3. Add the Optician Sans font
Download the Optician Sans font (.otf file) and place it inside the public folder with the exact name Optician-Sans.otf.
If you have the font elsewhere, copy it into public.

4. Install dependencies
Open a terminal in the project folder (where server.js is located) and run:

bash
npm init -y
npm install express socket.io
This creates package.json and installs the required packages.

5. Start the server
In the same terminal, run:

bash
node server.js
You should see:

text
🚀 Server running at http://localhost:3000
Controller → http://localhost:3000/controller
Display    → http://localhost:3000
6. Open the controller and display
On your computer, open a browser and go to http://localhost:3000/controller.

On your tablet (connected to the same Wi‑Fi network), find the computer’s local IP address (e.g., 192.168.1.10) and open http://<COMPUTER_IP>:3000.
The tablet will show the optotype display.

Important: Both devices must be on the same network. If the tablet cannot connect, check your firewall settings.

Usage Guide
Controller interface
Optotype: Choose between Landolt C and Tumbling E.

Polarity: Positive = black on white, Negative = white on black.

Screen PPI: Set to your tablet’s actual pixel density.

For the Boox Tab Ultra C in B/W mode: 300 PPI

For colour mode: 150 PPI
(If unsure, test with a known distance and measure the displayed size.)

Angular size: Default 0.833° (50 arcminutes). You can change this if needed.

Gap direction (manual): Click Right/Down/Left/Up to set the gap direction immediately. This stops any automatic rotation.

Stimuli direction change time: Time in seconds between random rotations when START is pressed.

Choose plane (distance): Four preset distances. The controller displays the calculated gap size in mm for the current distance and angular size.

START: Begins automatic random rotation using the current settings. The optotype will change direction every X seconds.

Display behaviour
The optotype is drawn exactly in the centre of the screen.

The size is recalculated in real time whenever you change distance, angular size, or PPI.

Manual direction commands override the automatic rotation.

The orientation mapping is:

0° = gap to the right

90° = gap down

180° = gap to the left

270° = gap up
(This matches standard Landolt C orientation.)

Verification of Physical Size
The readout on the controller shows the calculated gap size in millimetres. For the default 0.833° and the four distances, you should see:

Distance	Gap size (mm)
45 cm	6.55 mm
58 cm	8.44 mm
81 cm	11.78 mm
130 cm	18.91 mm
If the values differ slightly due to rounding, they are still correct within <0.02 mm.

Troubleshooting
Font not loading: Check that Optician-Sans.otf is in the public folder and that the server is running. Open the browser’s developer tools (F12) → Network tab and reload the controller page. Look for a request to Optician-Sans.otf – it should return status 200.

Optotype too small or too large: Verify the PPI setting. If your tablet is in colour mode, set PPI to 150. You can also measure the displayed gap with a ruler and adjust the PPI until it matches the expected mm.

No communication between controller and display: Ensure both devices are on the same network and that the tablet uses the computer’s IP address, not localhost. Try pinging the computer from the tablet.

Gap not visible on Landolt C: The drawing uses destination-out with a slightly oversized rectangle to guarantee a clean cut. If the gap still appears filled, it might be an anti‑aliasing issue on your specific browser. You can increase the overlap (e.g., -2 and +4) in display.html inside drawLandoltC().

Customisation
Add more distances: In controller.html, add another <button class="plane-btn"> with the appropriate distance in metres (e.g., 1.00 for 100 cm). The readout will update automatically.

Change default angular size: Edit the value attribute of the #angSize input.

Modify optotype proportions: Adjust the constants in drawLandoltC() and drawTumblingE() (e.g., outerRadius = strokePx * 2.5 sets the C’s diameter to 5× stroke). Keep the proportions consistent with standard optotype design.

License
This project is provided for research and educational purposes. The Optician Sans font is used under its own license (SIL Open Font License). Please refer to the font’s documentation for redistribution terms.

