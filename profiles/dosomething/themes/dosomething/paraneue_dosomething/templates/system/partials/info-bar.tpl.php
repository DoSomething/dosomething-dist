<?php

/**
 * Generates info bar footer.
 **/
?>

<?php if (isset($zendesk_form) || isset($sponsors)): ?>
<footer class="info-bar">
  <div class="wrapper">

    <?php if (isset($zendesk_form)): ?>
    <div class="help">
      <?php print t('Questions?'); ?> <a href="#" data-modal-href="#modal-contact-form"><?php print t('Contact Us'); ?></a>
      <div data-modal id="modal-contact-form" class="modal--contact" role="dialog">
        <h2 class="banner"><?php print t('Contact Us'); ?></h2>
        <p><?php print $zendesk_form_header; ?></p>
        <?php print render($zendesk_form); ?>
      </div>
    </div>
    <?php endif; ?>

    <?php if (isset($sponsors)): ?>
      <div class="sponsor">
      <?php print t("In partnership with @partners", array("@" => $formatted_partners)); ?>
      </div>
    <?php endif; ?>
  </div>
</footer>
<?php endif; ?>

