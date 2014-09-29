<?php

/**
 * @file
 * Content administration and module settings UI.
 */

/**
 * Configuration form
 */
function message_broker_producer_config_form($form, &$form_state) {

  $mb_config_settings = $message_broker_producer_load_config_options();

  $form['authentication'] = array(
    '#type' => 'fieldset',
    '#title' => t('RabbitMQ Authentication')
  );
  $form['authentication']['message_broker_producer_rabbitmq_host'] = array(
    '#type' => 'textfield',
    '#title' => t('host'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_host', 'localhost'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_port'] = array(
    '#type' => 'textfield',
    '#title' => t('port'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_port', '5672'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_username'] = array(
    '#type' => 'textfield',
    '#title' => t('Username'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_username', 'guest'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_password'] = array(
    '#type' => 'textfield',
    '#title' => t('Password'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_password', 'guest'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_vhost'] = array(
    '#type' => 'textfield',
    '#title' => t('vhost'),
    '#required' => FALSE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_vhost', ''),
  );

  $form['configuration'] = array(
    '#type' => 'fieldset',
    '#title' => t('Producer Configuration')
  );
  $form['configuration']['message_broker_producer_application_id'] = array(
    '#type' => 'textfield',
    '#title' => t('Application ID'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_application_id', '-1'),
  );
  $form['configuration']['exchange'] = array(
    '#type' => 'fieldset',
    '#title' => t('transactional Exchange')
  );
  $form['configuration']['exchange']['message_broker_producer_exchange_transactional_name'] = array(
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_exchange_transactional_name', 'transactionalExchange'),
  );
  $form['configuration']['exchange']['message_broker_producer_exchange_transactional_type'] = array(
    '#type' => 'textfield',
    '#title' => t('type'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_exchange_transactional_type', 'topic'),
  );
  $form['configuration']['exchange']['message_broker_producer_exchange_transactional_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_exchange_transactional_passive', '0'),
  );
  $form['configuration']['exchange']['message_broker_producer_exchange_transactional_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_exchange_transactional_durable', '1'),
  );
  $form['configuration']['exchange']['message_broker_producer_exchange_transactional_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_exchange_transactional_auto_delete', '0'),
  );

  $form['configuration']['queues'] = array(
    '#type' => 'fieldset',
    '#title' => t('Queues')
  );
  $form['configuration']['queues']['user_registration_queue'] = array(
    '#type' => 'fieldset',
    '#title' => t('User Registration Queue')
  );
  $form['configuration']['queues']['user_registration_queue']['message_broker_producer_queue_registrations_name'] = array(
    '#type' => 'textfield',
    '#title' => t('name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_registrations_name', 'userRegistrationQueue'),
  );
  $form['configuration']['queues']['user_registration_queue']['message_broker_producer_queue_registrations_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_registrations_passive', '0'),
  );
  $form['configuration']['queues']['user_registration_queue']['message_broker_producer_queue_registrations_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_registrations_durable', '1'),
  );
  $form['configuration']['queues']['user_registration_queue']['message_broker_producer_queue_registrations_exclusive'] = array(
    '#type' => 'textfield',
    '#title' => t('exclusive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_registrations_exclusive', '0'),
  );
  $form['configuration']['queues']['user_registration_queue']['message_broker_producer_queue_registrations_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_registrations_auto_delete', '0'),
  );
  $form['configuration']['queues']['user_registration_queue']['message_broker_producer_queue_registrations_binding_key'] = array(
    '#type' => 'textfield',
    '#title' => t('bindingKey'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_registrations_binding_key', 'user.registration.*'),
  );

  $form['configuration']['queues']['mailchimp_campaign_signup_queue'] = array(
    '#type' => 'fieldset',
    '#title' => t('Mailchimp Campaign Signup Queue')
  );
  $form['configuration']['queues']['mailchimp_campaign_signup_queue']['message_broker_producer_queue_campaign_signups_name'] = array(
    '#type' => 'textfield',
    '#title' => t('name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_campaign_signups_name', 'mailchimpCampaignSignupQueue'),
  );
  $form['configuration']['queues']['mailchimp_campaign_signup_queue']['message_broker_producer_queue_campaign_signups_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_campaign_signups_passive', '0'),
  );
  $form['configuration']['queues']['mailchimp_campaign_signup_queue']['message_broker_producer_queue_campaign_signups_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_campaign_signups_durable', '1'),
  );
  $form['configuration']['queues']['mailchimp_campaign_signup_queue']['message_broker_producer_queue_campaign_signups_exclusive'] = array(
    '#type' => 'textfield',
    '#title' => t('exclusive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_campaign_signups_exclusive', '0'),
  );
  $form['configuration']['queues']['mailchimp_campaign_signup_queue']['message_broker_producer_queue_campaign_signups_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_campaign_signups_auto_delete', '0'),
  );
  $form['configuration']['queues']['mailchimp_campaign_signup_queue']['message_broker_producer_queue_campaign_signups_binding+key'] = array(
    '#type' => 'textfield',
    '#title' => t('bindingKey'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_campaign_signups_binding_key', 'campaign.signup.*'),
  );

  $form['configuration']['queues']['transactional_queue'] = array(
    '#type' => 'fieldset',
    '#title' => t('Transactional Queue')
  );
  $form['configuration']['queues']['transactional_queue']['message_broker_producer_queue_transactional_name'] = array(
    '#type' => 'textfield',
    '#title' => t('name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_transactional_name', 'transactionalQueue'),
  );
  $form['configuration']['queues']['transactional_queue']['message_broker_producer_queue_transactional_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_transactional_passive', '0'),
  );
  $form['configuration']['queues']['transactional_queue']['message_broker_producer_queue_transactional_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_transactional_durable', '1'),
  );
  $form['configuration']['queues']['transactional_queue']['message_broker_producer_queue_transactional_exclusive'] = array(
    '#type' => 'textfield',
    '#title' => t('exclusive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_transactional_exclusive', '0'),
  );
  $form['configuration']['queues']['transactional_queue']['message_broker_producer_queue_transactional_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_transactional_auto_delete', '0'),
  );
  $form['configuration']['queues']['transactional_queue']['message_broker_producer_queue_transactional_binding_key'] = array(
    '#type' => 'textfield',
    '#title' => t('bindingKey'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_transactional_binding_key', '*.*.transactional'),
  );

  $form['configuration']['queues']['user_API_registration_queue'] = array(
    '#type' => 'fieldset',
    '#title' => t('User API Registration Queue')
  );
  $form['configuration']['queues']['user_API_registration_queue']['message_broker_producer_queue_user_API_registration_name'] = array(
    '#type' => 'textfield',
    '#title' => t('name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_registration_name', 'userAPIRegistrationQueue'),
  );
  $form['configuration']['queues']['user_API_registration_queue']['message_broker_producer_queue_user_API_registration_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_registration_passive', '0'),
  );
  $form['configuration']['queues']['user_API_registration_queue']['message_broker_producer_queue_user_API_registration_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_registration_durable', '1'),
  );
  $form['configuration']['queues']['user_API_registration_queue']['message_broker_producer_queue_user_API_registration_exclusive'] = array(
    '#type' => 'textfield',
    '#title' => t('exclusive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_registration_exclusive', '0'),
  );
  $form['configuration']['queues']['user_API_registration_queue']['message_broker_producer_queue_userAPIRegistration_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_userAPIRegistration_auto_delete', '0'),
  );
  $form['configuration']['queues']['user_API_registration_queue']['message_broker_producer_queue_user_API_registration_binding_key'] = array(
    '#type' => 'textfield',
    '#title' => t('bindingKey'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_registration_binding_key', 'user.registration.#'),
  );

  $form['configuration']['queues']['user_API_campaign_activity_queue'] = array(
    '#type' => 'fieldset',
    '#title' => t('User API Campaign Activity')
  );
  $form['configuration']['queues']['user_API_campaign_activity_queue']['message_broker_producer_queue_user_API_campaign_activity_name'] = array(
    '#type' => 'textfield',
    '#title' => t('name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_campaign_activity_name', 'userAPICampaignActivityQueue'),
  );
  $form['configuration']['queues']['user_API_campaign_activity_queue']['message_broker_producer_queue_user_API_campaign_activity_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_campaign_activity_passive', '0'),
  );
  $form['configuration']['queues']['user_API_campaign_activity_queue']['message_broker_producer_queue_user_API_campaign_activity_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_campaign_activity_durable', '1'),
  );
  $form['configuration']['queues']['user_API_campaign_activity_queue']['message_broker_producer_queue_user_API_campaign_activity_exclusive'] = array(
    '#type' => 'textfield',
    '#title' => t('exclusive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_campaign_activity_exclusive', '0'),
  );
  $form['configuration']['queues']['user_API_campaign_activity_queue']['message_broker_producer_queue_user_API_campaign_activity_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_campaign_activity_auto_delete', '0'),
  );
  $form['configuration']['queues']['user_API_campaign_activity_queue']['message_broker_producer_queue_user_API_campaign_activity_binding_key'] = array(
    '#type' => 'textfield',
    '#title' => t('bindingKey'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_user_API_campaign_activity_binding_key', 'campaign.*.*'),
  );

  $form['configuration']['queues']['activity_stats_queue'] = array(
    '#type' => 'fieldset',
    '#title' => t('Activity Stats')
  );
  $form['configuration']['queues']['activity_stats_queue']['message_broker_producer_queue_activity_stats_queue_name'] = array(
    '#type' => 'textfield',
    '#title' => t('name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_activity_stats_name', 'activityStatsQueue'),
  );
  $form['configuration']['queues']['activity_stats_queue']['message_broker_producer_queue_activity_stats_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_activity_stats_passive', '0'),
  );
  $form['configuration']['queues']['activity_stats_queue']['message_broker_producer_queue_activity_stats_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_activity_stats_durable', '1'),
  );
  $form['configuration']['queues']['activity_stats_queue']['message_broker_producer_queue_activity_stats_exclusive'] = array(
    '#type' => 'textfield',
    '#title' => t('exclusive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_activity_stats_exclusive', '0'),
  );
  $form['configuration']['queues']['activity_stats_queue']['message_broker_producer_queue_activity_stats_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_activity_stats_auto_delete', '0'),
  );
  $form['configuration']['queues']['activity_stats_queue']['message_broker_producer_queue_activity_stats_binding_key'] = array(
    '#type' => 'textfield',
    '#title' => t('bindingKey'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_activity_stats_binding_key', '*.*.transactional'),
  );

  $form['configuration']['queues']['logging_queue'] = array(
    '#type' => 'fieldset',
    '#title' => t('Logging')
  );
  $form['configuration']['queues']['logging_queue']['message_broker_producer_queue_logging_queue_name'] = array(
    '#type' => 'textfield',
    '#title' => t('name'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_logging_name', 'loggingQueue'),
  );
  $form['configuration']['queues']['logging_queue']['message_broker_producer_queue_logging_passive'] = array(
    '#type' => 'textfield',
    '#title' => t('passive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_logging_passive', '0'),
  );
  $form['configuration']['queues']['logging_queue']['message_broker_producer_queue_logging_durable'] = array(
    '#type' => 'textfield',
    '#title' => t('durable'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_logging_durable', '1'),
  );
  $form['configuration']['queues']['logging_queue']['message_broker_producer_queue_logging_exclusive'] = array(
    '#type' => 'textfield',
    '#title' => t('exclusive'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_logging_exclusive', '0'),
  );
  $form['configuration']['queues']['logging_queue']['message_broker_producer_queue_logging_auto_delete'] = array(
    '#type' => 'textfield',
    '#title' => t('auto_delete'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_logging_auto_delete', '0'),
  );
  $form['configuration']['queues']['logging_queue']['message_broker_producer_queue_logging_binding_key'] = array(
    '#type' => 'textfield',
    '#title' => t('bindingKey'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_queue_logging_binding_key', '*.*.transactional'),
  );

  return system_settings_form($form);
}

/**
 * List RabbitMQ status
 */
function message_broker_producer_status() {

  $status = '';

  // List queues
  /* @todo: permission access issues for www user
   *
   * http://unix.stackexchange.com/questions/15264/executing-a-shell-command-from-php-with-shell-exec
   * Added:
   * http    ALL=(username) /usr/local/sbin/rabbitmqctl
   * to /etc/sudoers
   *
   * Program Execution in PHP: exec, system, passthru, and shell_exec, oh my!
   * http://chipmunkninja.com/Program-Execution-in-PHP%3A-exec-m@
   *
   * works
   * $directoryListing = shell_exec('ls -la /usr/local/sbin');
   */
  $queues = shell_exec('/usr/local/sbin/rabbitmqctl list_queues');
  if ($queues == NULL) {
    $status['queues'] = 'Queue Listing - No RabbitMQ queues found, check that RabbitMQ is running.';
  }
  else {
    $status['queues'] = print_r($queues, TRUE);
  }

  // List exchanges
  $exchanges = shell_exec('/usr/local/sbin/rabbitmqctl list_exchanges');
  if ($exchanges == NULL) {
    $status['exchanges'] = 'Exchange Listing - No RabbitMQ exchanges found, check that RabbitMQ is running.';
  }

  // List bindings
  $bindings = shell_exec('rabbitmqctl list_exchanges');
  if ($bindings == NULL) {
    $status['bindings'] = 'Bindings Listing - No RabbitMQ bindings found, check that RabbitMQ is running.';
  }

  // Test link to produce transactionals queue entry
  $test_links['all'] = 'Generate ' . l('test producer entry', 'admin/config/services/message-broker-producer/test') . '.';

  $test_links['campaign-signup'] = 'Generate ' . l('test campaign_signup producer entry', 'admin/config/services/message-broker-producer/test/campaign_signup') . '.';
  $test_links['campaign-reportback'] = 'Generate ' . l('test campaign_reportback producer entry', 'admin/config/services/message-broker-producer/test/campaign_reportback') . '.';
  $test_links['user-password'] = 'Generate ' . l('test user_password producer entry', 'admin/config/services/message-broker-producer/test/user_password') . '.';
  $test_links['user-register'] = 'Generate ' . l('test user_register producer entry', 'admin/config/services/message-broker-producer/test/user_register') . '.';
  $test_links['user-register-under'] = 'Generate ' . l('test user_register_under producer entry', 'admin/config/services/message-broker-producer/test/user_register_under') . '.';
  $test_links['campaign-signup-noname'] = 'Generate ' . l('test campaign_signup_noname producer entry', 'admin/config/services/message-broker-producer/test/campaign_signup_noname') . '.';
  $test_links['campaign-reportback-noname'] = 'Generate ' . l('test campaign_reportback_noname producer entry', 'admin/config/services/message-broker-producer/test/campaign_reportback_noname') . '.';
  
  return theme('message_broker_producer_status', array('status' => $status, 'test_links' => $test_links));
}

/**
 * Load mb_config.json from library and format as PHP object.
 */
function message_broker_producer_load_config_options() {

  $mb_config_library = libraries_load('messagebroker-config');
  $mb_config_path = $GLOBALS['base_url'] . '/' . $mb_config_library['library path'] . '/mb_config.json';
  $mb_config_json = file_get_contents($mb_config_path);
  $mb_config_settings = json_decode($mb_config_json);

  return $mb_config_settings;
}
