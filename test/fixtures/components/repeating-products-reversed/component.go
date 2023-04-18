<div class="container">
	{{ range .0_list }}
	<div class="single-product">
		{{ .1_markdown | markdownify }}
	</div>
	{{ end }}
</div>