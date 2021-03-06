'use strict';

module.exports = {
	app: {
		title: 'targets-io',
		description: 'Performance test dashboard',
		keywords: 'MongoDB, Express, AngularJS, Node.js'
	},
	logLevel: 'info',
	graphiteRetentionPeriod: '90d', /*90 days*/
	graphiteUrl: process.env.GRAPHITE_URL,
	jenkinsUrl: process.env.JENKINS_URL,
	db: process.env.MONGO_URL,
	dbConnectionPooling: false,
	redisHost: process.env.REDIS_HOST,
	redisPort: process.env.REDIS_PORT,
	port: process.env.PORT || 3000,
	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	assets: {
		lib: {
			css: [
				'public/lib/angular-material/angular-material.min.css',
				'public/css/style.css',
				'public/lib/components-font-awesome/css/font-awesome.min.css',
				'public/lib/bootstrap/dist/css/bootstrap.min.css',
				'public/lib/bootstrap/dist/css/bootstrap-theme.min.css',
				'public/lib/angular-busy/dist/angular-busy.css',
				'public/lib/ng-table/dist/ng-table.css',
				'public/lib/ng-tags-input/ng-tags-input.min.css',
				'public/lib/sc-date-time/dist/sc-date-time.css'


			],
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/jquery-ui/jquery-ui.min.js',
				'public/lib/angular/angular.min.js',
				'public/lib/angular-cookies/angular-cookies.js',
				'public/lib/angular-sanitize/angular-sanitize.min.js',
				'public/lib/angular-aria/angular-aria.min.js',
				'public/lib/angular-animate/angular-animate.min.js',
				'public/lib/angular-material/angular-material.min.js',
				'public/lib/angular-resource/angular-resource.min.js',
				'public/lib/angular-ui-router/release/angular-ui-router.min.js',
				'public/lib/angular-ui-utils/ui-utils.min.js',
				'public/lib/angular-messages/angular-messages.min.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
				'public/lib/showdown/dist/showdown.min.js',
				'public/lib/showdown-target-blank/dist/showdown-target-blank.min.js',
				'public/lib/moment/moment.js',
				'public/lib/angular-spinners/dist/angular-spinners.js',
				'public/lib/angular-busy/dist/angular-busy.js',
				'public/lib/ng-table/dist/ng-table.js',
				'public/lib/ng-tags-input/ng-tags-input.min.js',
				'public/lib/underscore/underscore-min.js',
				'public/lib/ng-clip/dest/ng-clip.min.js',
				'public/lib/zeroclipboard/dist/ZeroClipboard.min.js',
				'public/lib/angular-utils-pagination/dirPagination.js',
				'public/lib/dygraphs/dygraph-combined-dev.js',
				'public/js/dygraph-extra.js',
				'public/lib/ng-focus-if/focusIf.min.js',
				'public/lib/socket.io-client/dist/socket.io.min.js',
				'public/lib/pdfmake/build/pdfmake.min.js',
				'public/lib/pdfmake/build/vfs_fonts.js',
				'public/lib/ng-sortable/dist/ng-sortable.js',
				'public/lib/sc-date-time/dist/sc-date-time.js'


			]
		},
		css: [
			'public/modules/**/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/*/*.js',
			'public/modules/*/*[!tests]*/*.js',
			'public/modules/*/*[!tests]*/*/*.js'

		],
		tests: [
			'public/lib/angular-mocks/angular-mocks.js',
			'public/modules/*/tests/*.js'
		]
	}
};
