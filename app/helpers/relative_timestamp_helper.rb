module RelativeTimestampHelper
  def relative_timestamp_tag(time, fallback:, locale: "en", classes: nil, **options)
    tag.time(
      fallback,
      **options,
      datetime: time.iso8601,
      class: classes,
      data: {
        controller: "relative-timestamp",
        relative_timestamp_timestamp_value: time.iso8601,
        relative_timestamp_locale_value: locale
      }
    )
  end
end
