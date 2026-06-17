require "test_helper"

class DocsControllerTest < ActionDispatch::IntegrationTest
  test "root renders documentation UI" do
    get root_path

    assert_response :success
    assert_includes response.body, "Relative Timestamp Element for Rails + Stimulus"
    assert_includes response.body, "npm install ../relative-timestamp-element"
  end

  test "page includes Stimulus timestamp examples" do
    get root_path

    assert_response :success
    assert_includes response.body, 'data-controller="relative-timestamp"'
    assert_includes response.body, "data-relative-timestamp-timestamp-value"
    assert_includes response.body, "data-relative-timestamp-locale-value=\"es\""
  end

  test "page includes dynamic timestamp demo controller" do
    get root_path

    assert_response :success
    assert_includes response.body, 'data-controller="demo-timestamps"'
    assert_includes response.body, 'data-action="demo-timestamps#add"'
    assert_includes response.body, 'aria-live="polite"'
  end

  test "page includes real-time scale sandbox" do
    get root_path

    assert_response :success
    assert_includes response.body, 'id="sandbox"'
    assert_includes response.body, 'data-controller="timestamp-sandbox"'
    assert_includes response.body, 'data-action="timestamp-sandbox#clear"'
    assert_includes response.body, 'data-action="timestamp-sandbox#runMixedBatch"'
    assert_includes response.body, 'data-action="timestamp-sandbox#runEnglishBatch"'
    assert_includes response.body, 'data-action="timestamp-sandbox#runSpanishBatch"'
    assert_includes response.body, 'data-action="timestamp-sandbox#addCustom"'
    assert_includes response.body, 'data-timestamp-sandbox-target="emptyState"'
    assert_includes response.body, 'data-timestamp-sandbox-target="resultCount"'
    assert_includes response.body, 'data-timestamp-sandbox-target="customDatetime"'
    assert_includes response.body, "Try it live with generated timestamps"
    assert_includes response.body, "Pick a quick scenario"
    assert_includes response.body, "Run basic batch"
    assert_includes response.body, "Run English batch"
    assert_includes response.body, "Run Spanish batch"
    assert_includes response.body, "Custom timestamp"
    assert_includes response.body, "Add custom timestamp"
    assert_includes response.body, "Ready to generate timestamps"
  end
end
