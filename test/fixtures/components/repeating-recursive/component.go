<div>
	{{ range .0_list }}
		<div>
		{{ range .1_list }}
		<div>
			<h4 class="heading">{{ .2 }}</h4>
			{{ .3_markdown | markdownify }}<div>
				{{ range .4_list }}
		<a class="link" href="{{ .6_url }}">{{ .5 }}</a>
	{{ end }}
			</div>
		</div>
	{{ end }}
	</div>
	{{ end }}
</div>