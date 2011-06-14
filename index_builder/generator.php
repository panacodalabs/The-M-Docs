<?php

    $handle = fopen('../index.json', 'w');
    fwrite($handle, 'TEST');
    fclose($handle);

?>