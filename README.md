<p align="center">
  <img width="128" height="128" alt="MyJot-iOS-Default-1024x1024@1x" src="https://github.com/user-attachments/assets/0422a4f1-284d-435a-b714-59dff1aa7c7c" />
</p>

<h1 align="center">MyJot</h1>

> [!WARNING]
> Please note that this is technically still a beta version undergoing active development, and pending an official release.

MyJot is a free & open source PWA that logs your workouts and meals without ever needing to share your data. Works offline! No sign up required. 

Access the app [here](https://sureshs13.github.io/MyJot/).

<br>

<h1 align="center">Why MyJot?</h1>

MyJot was built to be easy to use and privacy-focused. We do not store or sell your personal data, and the app will always be free and open source. Our goal is to give you peace of mind and let you focus on your health goals. 

<br>


<h1 align="center">What can it do?</h1>

MyJot currently offers the following functionalities:

- Log meals
- Log workouts
- Add custom meal presets
- Add custom workout presets

<br>

<h1 align="center">How is my data stored?</h1>

MyJot stores your data in `.myjot` files that you save to your device each time you use the app. When you need to access your data, you will need to upload your `.myjot` file to the app, make your changes, and then save it back to your system. New users can start logging their information in the app without a prior `.myjot` file, and then save their data back onto their machine once finished for later access.

> [!CAUTION]
> MyJot, by design, does not persist your data past your current session. Please make sure that you save your data back as a `.myjot` file on your system before you close the app. <ins>There is nothing we can do to recover your data if you forget to export it out of the app before closing it.</ins>

<br>

<h1 align="center">Development roadmap</h1>

Some of the current items planned are:

- Adding reporting capabilities (on the "Stats" page).
- Adding functionality to use Web Workers for files 1-10MB to keep UI responsive as `.myjot` files grow larger in size.

<br>

<h1 align="center">Building from source</h1>

__Prerequisites__

- A browser
- A code editor or IDE (**Visual Studio Code** should suffice)
- A local development server that supports live browser reload (we used [Live Server](https://github.com/ritwickdey/vscode-live-server))

__Instructions__
1. Clone the repository
2. Launch the website using the development server.

<br>

<h1 align="center">Reporting bugs</h1>

If you notice any bugs in the application, please open an issue to notify us.

<br>

<h1 align="center">Contributing</h1>

If you are interested in contributing to the project in any capacity- whether on a bug-fix or new feature -please open an issue first so we can discuss it.

If we decide to move forward, please ensure the following while working on your changes:
- Browser testing must be done on Firefox (or any Firefox fork), Chrome (or any Chromium-based browser), and Safari (or any WebKit based browser), to verify that the app is functional and meets the PWA installability criteria (both on desktop and mobile devices).
- Layout changes must be responsive and function on desktop, tablet and mobile viewports.
- Methods should have JSDoc documentation, and comments should be added where necessary.
- Saving and uploading `.myjot` files should continue to function as expected.

<br>

<h1 align="center">License</h1>

MyJot is distributed under the AGPL-3.0 license. For more information, please read the full license details [here](https://github.com/SureshS13/MyJot/blob/main/LICENSE).

<br>
