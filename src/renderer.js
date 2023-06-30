const closeButton = document.getElementById('close-button');

// close on X button
closeButton.addEventListener('click', () => {
  console.log('close button clicked');
  api.closeWindow();
});

// setTimeout(() => {
//   // close on lost focus
//   window.addEventListener('blur', () => {
//     console.log('window lost focus');
//     // wait 1 second, close if mouse not on window
//     setTimeout(() => {
//       if (!window.isFocused()) {
//         console.log('window is not focused, closing');
//         api.closeWindow();
//       }
//     }, 1000);
//   });
// }, 500);
