<?php

class Campaign {

  public $id;
  protected $node;
  protected $variables;

  public function __construct($id) {
    $this->id = $id;
    $this->node = node_load($id);

    if ($this->node && $this->node->type === 'campaign') {
      $this->variables = dosomething_helpers_get_variables('node', $this->id);
      $this->title = $this->node->title;
      $this->tagline = $this->getTagline();
      $this->created_at = $this->node->created;
      $this->updated_at = $this->node->changed;
      $this->status = $this->getStatus();
      $this->type = $this->getType();
      $this->time_commitment = $this->getTimeCommitment();
      $this->cover_image['default'] = $this->getCoverImage();
      $this->cover_image['alternate'] = $this->getCoverImageAlt();
      $this->scholarship = $this->getScholarship();
      $this->staff_pick = $this->getStaffPickStatus();

      $fact_data = $this->getFactData();
      $this->facts['problem'] = $fact_data['fact_problem'];
      $this->facts['solution'] = $fact_data['fact_solution'];
      $this->facts['sources'] = $fact_data['sources'];

      $solution_data = $this->getSolutionData();
      $this->solutions = $solution_data;

      $cause_data = $this->getCauses();
      $this->causes['primary'] = $cause_data['primary'];
      $this->causes['secondary'] = $cause_data['secondary'];

      $action_types_data = $this->getActionTypes();
      $this->action_types['primary'] = $action_types_data['primary'];
      $this->action_types['secondary'] = $action_types_data['secondary'];

      $this->issue = $this->getIssue();
      $this->tags = $this->getTags();
    }
    else {
      throw new Exception('Campaign does not exist!');
    }
  }


  /**
   * Get both primary and secondary Action Types for campaign if available.
   *
   * @return array
   */
  protected function getActionTypes() {
    // @TODO: Potentially (or very likely can) combine this with getCauses() to DRY up code.
    $data = array();
    $data['primary'] = NULL;
    $data['secondary'] = NULL;

    $primary_action_type_id = dosomething_helpers_extract_field_data($this->node->field_primary_action_type);
    $secondary_action_type_ids = dosomething_helpers_extract_field_data($this->node->field_action_type);

    if ($primary_action_type_id) {
      $data['primary'] = $this->getTaxonomyTerm($primary_action_type_id);
    }

    if ($secondary_action_type_ids) {
      $secondary_action_types = array();

      foreach($secondary_action_type_ids as $tid) {
        $secondary_action_types[] = $this->getTaxonomyTerm($tid);
      }

      $data['secondary'] = $secondary_action_types;
    }

    return $data;
  }


  /**
   * Get both primary and secondary Causes for campaign if available.
   *
   * @return array
   */
  protected function getCauses() {
    // @TODO: Potentially combine this with getActionTypes() to DRY up code.
    $data = array();
    $data['primary'] = NULL;
    $data['secondary'] = NULL;

    $primary_cause_id = dosomething_helpers_extract_field_data($this->node->field_primary_cause);
    $secondary_cause_ids = dosomething_helpers_extract_field_data($this->node->field_cause);

    if ($primary_cause_id) {
      $data['primary'] = $this->getTaxonomyTerm($primary_cause_id);
    }

    if ($secondary_cause_ids) {
      if (is_array($secondary_cause_ids)) {
        $secondary_causes = array();

        foreach($secondary_cause_ids as $tid) {
          $secondary_causes[] = $this->getTaxonomyTerm($tid);
        }
      }
      else {
        $secondary_causes[] = $this->getTaxonomyTerm($secondary_cause_ids);
      }

      $data['secondary'] = $secondary_causes;
    }

    return $data;
  }


  /**
   * Get the cover image data for campaign if available.
   *
   * @param string|null $id Image node id.
   * @return array|null
   */
  protected function getCoverImage($id = NULL) {
    if (is_null($id)) {
      $id = dosomething_helpers_extract_field_data($this->node->field_image_campaign_cover);
    }

    // @TODO: This could potentially be turned into an Image class, and load the data by including and then instantiating the class $image = new Image($id);
    // This would help cleanup some of the code, and keep things DRYer.
    if ($id) {
      $image = node_load($id);
    }
    else {
      return NULL;
    }

    $data = array();

    $data['id'] = $image->nid;
    $data['type'] = $image->type;
    $data['title'] = $image->title;
    $data['created_at'] = $image->created;
    $data['updated_at'] = $image->changed;
    $data['dark_background'] = (bool) dosomething_helpers_extract_field_data($image->field_dark_image);

    // @TODO: consider reworking following function to return data instead of assigning it by reference to variable. Kind of confusing.
    dosomething_campaign_load_image_url($data['sizes'], $image);
    if ($data['sizes']['landscape']) {
      $data['sizes']['landscape']['uri'] = dosomething_image_get_themed_image_url($image->nid, 'landscape', '1440x810');
    }

    if ($data['sizes']['square']) {
      $data['sizes']['square']['uri'] = dosomething_image_get_themed_image_url($image->nid, 'square', '300x300');
    }

    return $data;
  }


  /**
   * Get alternative cover image for campaign if available.
   *
   * @return array|null
   */
  protected function getCoverImageAlt() {
    $image_id = $this->variables['alt_image_campaign_cover_nid'];

    if ($image_id) {
      return $this->getCoverImage($image_id);
    }
    else {
      return NULL;
    }
  }


  /**
   * Get Facts data for campaign if available; collects both fact problem
   * and fact solution as well as the sources for both.
   *
   * @return array|null
   */
  protected function getFactData() {
    $data = array();

    $fact_fields = array('field_fact_problem', 'field_fact_solution');
    $fact_vars = dosomething_fact_get_mutiple_fact_field_vars($this->node, $fact_fields);

    if (!empty($fact_vars)) {
      foreach ($fact_vars['facts'] as $index => $fact_data) {
        $index = str_replace('field_', '', $index);

        $data[$index]['fact'] = dosomething_helpers_isset($fact_data['fact']);
        $data[$index]['id'] = dosomething_helpers_isset($fact_data['nid']);
        $data[$index]['footnote'] = (int) dosomething_helpers_isset($fact_data['footnotes']);
        $data[$index]['source'] = dosomething_helpers_isset($fact_data['sources']);

      }

      $sources = dosomething_helpers_isset($fact_vars['sources']);
      foreach ($sources as $index => $source) {
        $data['sources'][$index]['formatted'] = $source;
      }

      return $data;
    }

    return NULL;

  }


  /**
   * Get the Issue for campaign if available.
   *
   * @return array|null
   */
  protected function getIssue() {
    // @TODO: Need to find out if this is allowed to be a field with multiple values...?
    $issue_id = dosomething_helpers_extract_field_data($this->node->field_issue);

    if ($issue_id) {
      $issue = $this->getTaxonomyTerm($issue_id);

      return $issue;
    }

    return NULL;
  }


  /**
   * Get Tags assigned to campaign if available.
   *
   * @return array|null
   */
  protected function getTags() {
    $data = array();

    $tag_ids = dosomething_helpers_extract_field_data($this->node->field_tags);

    if ($tag_ids) {
      foreach ($tag_ids as $id) {
        $data[] = $this->getTaxonomyTerm($id);
      }

      return $data;
    }

    return NULL;
  }


  /**
   * Get taxonomy term node data from provided id.
   *
   * @param $id
   * @return array
   */
  protected function getTaxonomyTerm($id) {
    $data = array();

    $taxonomy = taxonomy_term_load($id);

    $data['id'] = $taxonomy->tid;
    $data['name'] = strtolower($taxonomy->name);

    return $data;
  }


  /**
   * Get the Tagline for campaign.
   *
   * @return array|null
   */
  protected function getTagline() {
    return dosomething_helpers_extract_field_data($this->node->field_call_to_action);
  }


  /**
   * Get the specified Time Commitment for campaign.
   *
   * @return float
   */
  protected function getTimeCommitment() {
    // @TODO: I've renamed "active_hours" to "time_commitment" because it sounds more straightforward; but appreciate feedback.
    return (float) dosomething_helpers_extract_field_data($this->node->field_active_hours);
  }


  /**
   * Get the Scholarship amount for campaign if available.
   * @return array|null
   */
  protected function getScholarship() {
    return dosomething_helpers_extract_field_data($this->node->field_scholarship_amount);
  }


  /**
   * Get the Solutions data for campaign if available; collects both the main solution copy
   * and the solution support copy.
   *
   * @return array
   */
  protected function getSolutionData() {
    $data['copy'] = dosomething_helpers_extract_field_data($this->node->field_solution_copy);
    $data['support_copy'] = dosomething_helpers_extract_field_data($this->node->field_solution_support);

    return $data;
  }


  /**
   * Get status whether this campaign is a Staff Pick or not.
   *
   * @return bool
   */
  protected function getStaffPickStatus() {
    return (bool) dosomething_helpers_extract_field_data($this->node->field_staff_pick);
  }


  /**
   * Get Status of campaign.
   *
   * @return string|null
   */
  protected function getStatus() {
    return dosomething_helpers_extract_field_data($this->node->field_campaign_status);
  }


  /**
   * Get Type of campaign.
   *
   * @return string|null
   */
  protected function getType() {
    return dosomething_helpers_extract_field_data($this->node->field_campaign_type);
  }

}
