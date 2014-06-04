<?php

/**
 * Generates basic HTML structure.
 * @see https://drupal.org/node/1728208
 **/

?>

<!DOCTYPE html>
<!--[if lte IE 8 ]> <html dir="ltr" lang="en-US" class="no-js ie8"> <![endif]-->
<!--[if IE 9 ]> <html dir="ltr" lang="en-US" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--><html class="no-js"><!--<![endif]-->

<head>
  <title><?php print $head_title; ?></title>
  <script type="text/javascript" src="<?php print NEUE_ASSET_PATH; ?>/js/vendor/modernizr.js"></script>

  <link rel="stylesheet" href="<?php print NEUE_ASSET_PATH; ?>/neue.css" type="text/css" />
  <link rel="stylesheet" href="<?php print DS_STYLE_PATH; ?>" type="text/css" />
  <?php print $styles; ?>

  <!--[if lte IE 8]>
      <link type="text/css" rel="stylesheet" href="<?php print NEUE_ASSET_PATH; ?>/ie.css" media="all" />
      <link type="text/css" rel="stylesheet" href="<?php print DS_ASSET_PATH; ?>/ie.css" media="all" />

      <script type="text/javascript" src="<?php print LIB_ASSET_PATH; ?>/html5shiv/dist/html5shiv.min.js"></script>
      <script type="text/javascript" src="<?php print LIB_ASSET_PATH; ?>/respond/dest/respond.min.js"></script>
      <script type="text/javascript" src="<?php print DS_ASSET_PATH ?>/js/respond.custom.js"></script>
  <![endif]-->

  <link rel="shortcut icon" href="<?php print NEUE_ASSET_PATH; ?>/assets/images/favicon.ico">
  <link rel="apple-touch-icon-precomposed" href="<?php print NEUE_ASSET_PATH; ?>/assets/images/apple-touch-icon-precomposed.png">

  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <?php print $head; ?>
</head>

<body class="<?php print $classes; ?>" <?php print $attributes;?>>
  <!--[if lt IE 8 ]> <div class="messages error">You're using an unsupported browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to make sure everything works nicely!</div>  <![endif]-->
  <?php print $page_top; ?>
  <?php print $page; ?>

  <script type="text/javascript" src="<?php print DS_JAVASCRIPT_PATH; ?>"></script>
  <?php print $scripts; ?>
  <?php print $page_bottom; ?>
</body>

</html>
