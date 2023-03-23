<html>
<body>
  <p>
  <?php for( $i=1; $i<15; ++$i ): ?>
    &#x1f0a<?= dechex($i) ?>
  <?php endfor; ?>

  <p><font color="red">
  <?php for( $i=1; $i<15; ++$i ): ?>
    &#x1f0b<?= dechex($i) ?>
  <?php endfor; ?>
  </font>

  <p><font color="red">
  <?php for( $i=1; $i<15; ++$i ): ?>
    &#x1f0c<?= dechex($i) ?>
  <?php endfor; ?>
  </font>

  <p>
  <?php for( $i=1; $i<15; ++$i ): ?>
    &#x1f0d<?= dechex($i) ?>
  <?php endfor; ?>
