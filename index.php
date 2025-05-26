<!DOCTYPE html>
<?php

$config = require_once 'config/config.php';

// project/ 
// ├── lib/ 
// │ ├── p5.js 
// │ └── paper-full.js 
// ├── sketches/ 
// │ ├── p5-sketches/ 
// │ │ ├── sketch-001.js 
// │ │ ├── sketch-002.js 
// │ │ └── ... 
// │ └── paper-sketches/ 
// │ ├──── sketch-001.js 
// │ ├──── sketch-002.js 
// │ └──── ... 
// ├── utils/ 
// │ ├── p5-helpers.js 
// │ └── paper-helpers.js 
// ├── index.html 
// └── sketch-loader.js

?>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= $config['title'] ?></title>
  <link rel="stylesheet" href="assets/fonts/stylesheet.css">
  <link rel="stylesheet" href="assets/css/style.css">

  <script>
    <?php
    // Gets all sketches as file names
    $sketches = array_reverse(array_map(function ($string) {
      return preg_replace(['/sketches\//', '/\.js$/'], '', $string);
    }, glob('sketches/*.js')));
    ?>
    // Populate sketches 
    const sketches = ['<?= implode("', '", $sketches) ?>'];
    const lastLoadedSketch = '<?= $config['last_loaded_sketch'] ?>';
  </script>
  <script src="sketch-loader.js"></script>
  <script src="utils/helpers.js"></script>
  <script src="utils/perlin.js"></script>
  <script src="lib/webmidi.iife.js"></script>
  <script src="lib/second-order-dynamics.js"></script>
  <script src="	https://cdn.jsdelivr.net/npm/culori"></script>
  <script src="lib/choreography.js"></script>
  <script src="utils/interface.js" defer></script>
  <script src="utils/animation-control.js" defer></script>
  <script src="lib/paper-full.js"></script>
  <script src="utils/paper-helpers.js"></script>
  <script src="utils/switch-control.js"></script>
</head>

<body>
  <div id="controls">
    <fieldset id="sketch-loader">
      <legend>sketch loader</legend>
      <?php
      foreach ($sketches as $sketch) {
        ?>
        <label class="full-width" for="sketch-<?= $sketch ?>"><input <?= $sketch == $config['last_loaded_sketch'] ? 'checked' : '' ?> type="radio" value="<?= $sketch ?>" name="sketch" id="sketch-<?= $sketch ?>">
          <?= $sketch ?></label>
        <?php
      }
      ?>
    </fieldset>
    <fieldset>
      <legend>MIDI emulator</legend>
      <label class="full-width" for="chan0">chan0
        <input type="range" style="width:100%" name="chan0" value="<?= $config['chan0'] ?>" id="chan0" min="0" max="127"
          step=".1">
      </label>
      <label class="full-width" for="chan1">chan1
        <input type="range" style="width:100%" name="chan1" value="<?= $config['chan1'] ?>" id="chan1" min="0" max="127"
          step=".1">
      </label>
      <label class="full-width" for="chan2">chan2
        <input type="range" style="width:100%" name="chan2" value="<?= $config['chan2'] ?>" id="chan2" min="0" max="127"
          step=".1">
      </label>
      <label class="full-width" for="chan3">chan3
        <input type="range" style="width:100%" name="chan3" value="<?= $config['chan3'] ?>" id="chan3" min="0" max="127"
          step=".1">
      </label>
    </fieldset>
  </div>
  <main>
    <div id="output-wrapper">
      <output id="output-chan0">chan0: <?= str_pad($config['chan0'], 3, "0", STR_PAD_LEFT) ?>/127</output>
      <output id="output-chan1">chan1: <?= str_pad($config['chan1'], 3, "0", STR_PAD_LEFT) ?>/127</output>
      <output id="output-chan2">chan2: <?= str_pad($config['chan2'], 3, "0", STR_PAD_LEFT) ?>/127</output>
      <output id="output-chan3">chan3: <?= str_pad($config['chan3'], 3, "0", STR_PAD_LEFT) ?>/127</output>
    </div>
  </main>
  <?php

  // listens for POST request
  
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // update config.php
    if (is_array($data))
      foreach ($data as $key => $value)
        $config[$key] = $value;

    function formatValue($value)
    {
      if (is_array($value)) {
        return '[' .
          implode(', ', array_map(function ($v) {
            return formatValue($v);
          }, $value)) .
          ']';
      } elseif ($value === 'true' || $value === true) {
        return 'true';
      } elseif ($value === 'false' || $value === false) {
        return 'false';
      } elseif (is_int($value)) {
        return $value;
      } else {
        return "'$value'";
      }
    }

    // change config file content
    $config_str = "[\n";
    foreach ($config as $key => $value) {
      $formatted_value = '';
      // if (is_array($value)) {
      //   $formatted_array = array_map(function ($v) {
      //     return formatValue($v);
      //   }, $value);
      //   $formatted_value = '[' . implode(', ', $formatted_array) . ']';
      // } else {
      //   $formatted_value = formatValue($value);
      // }
      $formatted_value = formatValue($value);
      $config_str .= "  '$key' => $formatted_value,\n";
    }
    $config_str .= ']';

    $file_content = "<?php \n\nreturn $config_str;";
    file_put_contents('config/config.php', $file_content);
  }

  ?>
</body>
<script type="module">
  if (navigator.requestMIDIAccess) {

    // Enable WEBMIDI.js and trigger the onEnabled() function when ready
    WebMidi
      .enable()
      .then(onEnabled)
      .catch(err => alert(err));

    // Function triggered when WEBMIDI.js is ready
    function onEnabled() {

      if (WebMidi.inputs.length < 1) {
        console.log("No device detected.");
      } else {
        WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));
        WebMidi.outputs.forEach(output => console.log(output.manufacturer, output.name));
      }

      const device = WebMidi.inputs[0];
      if (device)
        device.addListener("controlchange", e => {
          const { message } = e;
          const [statusByte, controller, value] = message.data;
          // if (controller == 2) changeChanValue(null, 1, value);
          // else if (controller == 3) changeChanValue(null, 2, value);
          // else if (controller == 4) changeChanValue(null, 3, value);
          // else if (controller == 5) changeChanValue(null, 0, value);
          // if (controller == 2) changeChanValue(null, 0, value);
          // else if (controller == 3) changeChanValue(null, 1, value);
          // else if (controller == 4) changeChanValue(null, 2, value);
          // else if (controller == 5) changeChanValue(null, 3, value);
          // if (controller == 0) changeChanValue(null, 1, value);
          // else if (controller == 1) changeChanValue(null, 2, value);
          // else if (controller == 2) changeChanValue(null, 3, value);
          // else if (controller == 3) changeChanValue(null, 0, value);
          if (controller == 0) changeChanValue(null, 0, value);
          else if (controller == 1) changeChanValue(null, 1, value);
          else if (controller == 2) changeChanValue(null, 2, value);
          else if (controller == 3) changeChanValue(null, 3, value);
          // console.log(`Received 'controlchange' message.`, e.message);
          // }, { channels: [1] });
        });

    }
  }

</script>

</html>