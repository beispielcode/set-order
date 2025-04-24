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
    $p5sketches = array_reverse(array_map(function ($string) {
      return preg_replace(['/sketches\/p5-sketches\//', '/\.js$/'], '', $string);
    }, glob('sketches/p5-sketches/*.js')));
    $paperSketches = array_reverse(array_map(function ($string) {
      return preg_replace(['/sketches\/paper-sketches\//', '/\.js$/'], '', $string);
    }, glob('sketches/paper-sketches/*.js')));
    ?>
    // Populate sketches 
    const sketches = {
      p5: ['<?= implode("', '", $p5sketches) ?>'],
      paper: ['<?= implode("', '", $paperSketches) ?>']
    };
    const lastLoadedSketch = '<?= $config['last_loaded_sketch'][1] ?>';
    let colorIndex = <?= $config['color_index'] ?>;
    let workerActive = <?= $config['worker_active'] ? 'true' : 'false' ?>;
  </script>
  <script src="sketch-loader.js"></script>
  <script src="utils/helpers.js"></script>
  <script src="utils/perlin.js"></script>
  <script src="utils/Bezier-easing.js"></script>
  <script src="lib/webmidi.iife.js"></script>
  <script src="lib/second-order-dynamics.js"></script>
  <script src="lib/choreography.js"></script>
  <script src="	https://cdn.jsdelivr.net/npm/culori"></script>
  <script>
    console.log(culori.rgb('salmon'));
  </script>
  <script type="module">
    import { breezeid } from './lib/breezeid.js';
    window.breezeid = breezeid;
  </script>
  <script src="lib/vec.js"></script>
  <script src="lib/matrix.js"></script>
  <script src="lib/vertex.js"></script>
  <script src="lib/a-path-finder.js"></script>
  <!-- <script src="workers/worker-coordinator.js" defer></script> -->
  <script src="utils/interface.js" defer></script>
  <script src="lib/paper-full.js"></script>
  <script src="utils/paper-helpers.js"></script>
  <!-- <script src="utils/navigation.js" defer></script> -->
  <!-- <script src="https://cdn.jsdelivr.net/npm/p5"></script> -->
  <!-- <script src="https://cdn.jsdelivr.net/npm/p5.capture"></script> -->

  <!-- <script type="module" src="utils/at-protocol.js"></script> -->

</head>

<body>
  <div id="controls">
    <fieldset id="sketch-loader">
      <legend>sketch loader</legend>
      <select id="library-select" default="<?= $config['last_loaded_sketch'][0] ?>">
        <option value="p5" <?php echo $config['last_loaded_sketch'][0] == 'p5' ? 'selected="true"' : ''; ?>>p5.js
        </option>
        <option value="paper" <?php echo $config['last_loaded_sketch'][0] == 'paper' ? 'selected="true"' : ''; ?>>
          Paper.js
        </option>
      </select>
      <select id="sketch-select" default="<?= $config['last_loaded_sketch'][1] ?>"></select>
      <button id="load-btn" class="full-width">Load Sketch</button>
      <span id="version-info" class="full-width"></span>
    </fieldset>
    <fieldset id="color-wrapper">
      <legend>Colours</legend>
      <?php
      foreach ($config['colors'] as $key => $color) {
        ?>
        <div class="color-scheme full-width">
          <div class="color">
            <input type="color" name="color-<?= $key ?>a" id="color-<?= $key ?>a" value="<?= $color[0] ?>">
            <input type="text" name="hex-<?= $key ?>a" id="hex-<?= $key ?>a" value="<?= $color[0] ?>">
          </div>
          <div class="color">
            <input type="color" name="color-<?= $key ?>b" id="color-<?= $key ?>b" value="<?= $color[1] ?>">
            <input type="text" name="hex-<?= $key ?>b" id="hex-<?= $key ?>b" value="<?= $color[1] ?>">
          </div>
          <div class="color">
            <input type="color" name="color-<?= $key ?>c" id="color-<?= $key ?>c" value="<?= $color[2] ?>">
            <input type="text" name="hex-<?= $key ?>c" id="hex-<?= $key ?>c" value="<?= $color[2] ?>">
          </div>
          <input type="radio" name="color-active" <?= intval($key) == $config['color_index'] ? 'checked' : '' ?>
            id="color-active-<?= $key ?>">
          <button id="delete-scheme-<?= $key ?>" class="delete-button">delete</button>
        </div>
        <?php
      }
      ?>
      <button id="add-color" class="full-width">add colour</button>
    </fieldset>
    <fieldset>
      <legend>MIDI emulator</legend>
      <label class="full-width" for="chan0">chan0
        <input type="range" style="width:100%" name="chan0" value="<?= $config['chan0'] ?>" id="chan0" min="0" max="127"
          step="1">
      </label>
      <label class="full-width" for="chan1">chan1
        <input type="range" style="width:100%" name="chan1" value="<?= $config['chan1'] ?>" id="chan1" min="0" max="127"
          step="1">
      </label>
      <label class="full-width" for="chan2">chan2
        <input type="range" style="width:100%" name="chan2" value="<?= $config['chan2'] ?>" id="chan2" min="0" max="127"
          step="1">
      </label>
      <label class="full-width" for="chan3">chan3
        <input type="range" style="width:100%" name="chan3" value="<?= $config['chan3'] ?>" id="chan3" min="0" max="127"
          step="1">
      </label>
    </fieldset>
    <fieldset>
      <legend>controls</legend>
      <label class="full-width" for="workers-active">
        Active workers
        <input type="checkbox" name="workers-active" id="workers-active" <?= isset($config['worker_active']) && $config['worker_active'] ? 'checked' : '' ?>>
      </label>
      <label class="full-width" for="debug-active">
        Active debug
        <input type="checkbox" name="debug-active" id="debug-active" <?= isset($config['debug']) && $config['debug'] ? 'checked' : '' ?>>
      </label>
      <label class="full-width" for="recording-active">
        Recording delay
        <input type="checkbox" name="recording-active" id="recording-active" <?= isset($config['recording']) && $config['recording'] ? 'checked' : '' ?>>
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
  <canvas id="navigation" width="356" height="356"></canvas>
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
    console.log(device);

    // const device = WebMidi.getInputByName("TYPE NAME HERE!")
    // device.channels.forEach((channel, index) => {
    //   channel.addListener("noteon", e => {
    //     console.log(e);

    //     console.log(`${e.note.name}`);
    //   });
    // })
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

</script>

</html>