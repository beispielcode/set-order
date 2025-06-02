<!DOCTYPE html>
<?php $config = require_once 'config/config.php'; ?>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= $config['title'] ?></title>
  <meta name="description" content="<?= $config['description'] ?>">
  <meta name="author" content="<?= $config['author'] ?>">
  <link rel="stylesheet" href="assets/fonts/stylesheet.css">
  <link rel="stylesheet" href="assets/css/style.css">
  <script>
    <?php
    // Gets all scenes as file names
    $scenes = array_reverse(array_map(function ($string) {
      return preg_replace(['/scenes\//', '/\.js$/'], '', $string);
    }, glob('scenes/*.js')));
    ?>
    // Populate scenes array
    const SCENES = ['<?= implode("', '", $scenes) ?>'];
  </script>
  <script src="utils/helpers.js"></script>
  <script src="lib/paper-full.js"></script>
  <script src="lib/culori.js"></script>
  <script src="lib/webmidi.iife.js"></script>
  <script src="lib/choreography.js"></script>
  <script src="lib/second-order-dynamics.js"></script>
  <script src="lib/perlin.js"></script>
  <script src="utils/scene-manager.js" defer></script>
  <script src="utils/animation-control.js" defer></script>
  <script src="utils/interface.js" defer></script>
  <script src="utils/switch-control.js" defer></script>
</head>

<body>
  <div id="paper-container">
    <canvas id="paper-canvas" keepalive="true" data-keepalive="true"></canvas>
  </div>
  <div id="log-wrapper"></div>
</body>

</html>