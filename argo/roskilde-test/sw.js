/* Service worker for this site. Lives here so its scope is this folder only;
 * all logic is shared in core/sw-core.js. */
importScripts('../../core/sw-core.js');
SHELL.push(
    '../../core/argo.css',
    '../../core/argo-logo.png',
    '../../core/fonts/NunitoSans-Book.ttf',
    '../../core/fonts/NunitoSans-Bold.ttf',
    '../../core/fonts/NunitoSans-Black.ttf'
);
