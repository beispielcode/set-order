<!DOCTYPE html>
<?php

$config = require_once 'config/config.php';

// project/ 
// ├── lib/ 
// │ ├── p5.min.js 
// │ └── paper-full.min.js 
// ├── sketches/ 
// │ ├── p5-sketches/ 
// │ │ ├── sketch-001.js 
// │ │ ├── sketch-002.js 
// │ │ └── ... 
// │ └── paper-sketches/ 
// │ ├── sketch-001.js 
// │ ├── sketch-002.js 
// │ └── ... 
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
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
    }

    #controls {
      position: fixed;
      padding: 1rem;
      top: 0;
      left: 0;
      width: 100vw;
      border-radius: 0 0 .5rem .5rem;
      z-index: 2;
      /*background: #CCC4;*/
      /* backdrop-filter: blur(.125rem);  */
    }

    select,
    button {
      font-size: 1rem;
      padding: .5rem;
      margin-right: 1rem;
    }

    #version-info {
      font-size: 1rem;
      /* color: #666; */
      margin-top: 5px;
    }

    canvas {
      position: fixed;
      top: 0;
      left: 0;
    }
  </style>
  <script src="sketch-loader.js"></script>
  <script src="utils/helpers.js"></script>
  <script src="utils/perlin.js"></script>
  <script src="utils/Bezier-easing.js"></script>
  <script src="lib/vec.js"></script>
  <script src="lib/matrix.js"></script>
  <script src="lib/vertex.js"></script>
  <script src="workers/worker-coordinator.js" defer></script>
  <!-- <script src="https://cdn.jsdelivr.net/npm/p5"></script> -->
  <!-- <script src="https://cdn.jsdelivr.net/npm/p5.capture"></script> -->

  <!-- <script type="module" src="utils/at-protocol.js"></script> -->

</head>

<body>
  <div id="controls">
    <select id="library-select" default="<?= $config['last_loaded_sketch'][0] ?>">
      <option value="p5" <?php echo $config['last_loaded_sketch'][0] == 'p5' ? 'selected="true"' : ''; ?>>p5.js
      </option>
      <option value="paper" <?php echo $config['last_loaded_sketch'][0] == 'paper' ? 'selected="true"' : ''; ?>>
        Paper.js
      </option>
    </select>
    <select id="sketch-select" default="<?= $config['last_loaded_sketch'][1] ?>"></select>
    <button id="load-btn">Load Sketch</button>
    <span id="version-info"></span>
    <label for="color-a">color a
      <input type="color" name="color-a" id="color-a" value="<?= $config['colors'][0] ?>">
    </label>
    <label for="color-b">color b
      <input type="color" name="color-b" id="color-b" value="<?= $config['colors'][1] ?>">
    </label>
    <label for="color-c">color c
      <input type="color" name="color-c" id="color-c" value="<?= $config['colors'][2] ?>">
    </label>
    <button id="save-colors">Save colors</button>
    <label for="workers-active">
      Active workers
      <input checked type="checkbox" name="workers-active" id="workers-active">
    </label>
    <label for="debug-active">
      Active debug
      <input checked type="checkbox" name="debug-active" id="debug-active" <?= isset($config['debug']) && $config['debug'] ? 'checked="true"' : '' ?>>
    </label>
    <input type="checkbox" name="recorder-toggle" id="recorder-toggle" <?= isset($config['recorder']) && $config['recorder'] ? 'checked="true"' : '' ?>>
  </div>

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

    const librarySelect = document.getElementById('library-select');
    const sketchSelect = document.getElementById('sketch-select');
    const loadBtn = document.getElementById('load-btn');
    const versionInfo = document.getElementById('version-info');
    const recorderToggle = document.getElementById('recorder-toggle');
    const colorInputs = document.querySelectorAll('input[type="color"]');
    const saveColorsButton = document.getElementById('save-colors');
    let colors = Array.from(colorInputs).map(input => input.value);
    colorInputs.forEach((input, index) => input.oninput = () => colors[index] = input.value)
    saveColorsButton.addEventListener('click', () => updateConfig('colors', colors))
    const workersActiveInput = document.getElementById('workers-active');
    let workerActive = workersActiveInput.checked;
    workersActiveInput.addEventListener('change', () => {
      workerActive = workersActiveInput.checked;
      if (workerActive) updateWorkers();
    });
    const debugActiveInput = document.getElementById('debug-active');
    let debugActive = <?= isset($config['debug']) && $config['debug'] ? 'true' : 'false' ?>;
    debugActiveInput.addEventListener('change', () => {
      debugActive = debugActiveInput.checked;
      updateConfig('debug', debugActive ? 'true' : 'false');
    })
    let recorder = <?= isset($config['recorder']) && $config['recorder'] ? 'true' : 'false' ?>;

    // Update sketch options when library changes
    function updateSketchOptions() {
      const library = librarySelect.value;
      sketchSelect.innerHTML = '';

      sketches[library].forEach(sketch => {
        const option = document.createElement('option');
        option.value = sketch;
        option.textContent = sketch;
        if (sketch == '<?= $config['last_loaded_sketch'][1] ?>')
          option.selected = true;
        sketchSelect.appendChild(option);
      });
    }

    // Initial population
    updateSketchOptions();

    // Event listeners
    librarySelect.addEventListener('change', updateSketchOptions);

    loadBtn.addEventListener('click', () => {
      const library = librarySelect.value;
      const sketch = sketchSelect.value;

      if (library === 'p5') {
        sketchLoader.loadP5Sketch(sketch);
      } else {
        sketchLoader.loadPaperSketch(sketch);
      }

      versionInfo.textContent = `Current: ${sketch}`;
    });

    recorderToggle.addEventListener('change', () => {
      if (recorderToggle.checked) {
        recorder = true;
      } else {
        try {
          sketchLoader.removeScript(`https://cdn.jsdelivr.net/npm/p5.capture`);
        } catch (error) {
          console.warn('No recorder script found')
        }
        recorder = false;
      }
      updateConfig('recorder', recorder ? 'true' : 'false');
    })

    // post new config to config/config.php
    async function updateConfig(...args) {
      const url = 'index.php';
      console.log(JSON.stringify(args));

      const request = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(args)
      })
    }
  </script>
  <?php

  // listens for POST request
  
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // update config.php
    if (count($data) == 2) {
      $config[$data[0]] = $data[1];
    } elseif (count($data) == 3) {
      $config[$data[0]][$data[1]] = $data[2];
    }

    function formatValue($value)
    {
      if ($value === 'true' || $value === true) {
        return 'true';
      } elseif ($value === 'false' || $value === false) {
        return 'false';
      } else {
        return "'$value'";
      }
    }

    // change config file content
    $config_str = "[\n";
    foreach ($config as $key => $value) {
      $formatted_value = '';
      if (is_array($value)) {
        $formatted_array = array_map(function ($v) {
          return formatValue($v);
        }, $value);
        $formatted_value = '[' . implode(', ', $formatted_array) . ']';
      } else {
        $formatted_value = formatValue($value);
      }
      $config_str .= "  '$key' => $formatted_value,\n";
    }
    $config_str .= ']';

    $file_content = "<?php \n\nreturn $config_str;";
    file_put_contents('config/config.php', $file_content);
  }

  ?>
</body>

</html>