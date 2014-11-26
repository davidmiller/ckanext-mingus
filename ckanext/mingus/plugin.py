"""
OMG - Plugin definitions !
"""
from ckan.lib import base
from ckan import plugins
from ckan.plugins import toolkit

class MingusPlugin(plugins.SingletonPlugin):
    """
    THIS IS THE PLUGIN.
    """
    plugins.implements(plugins.IConfigurer)

    def update_config(self, config):
        """
        Add configuration values (e.g. templates, resources)
        """
        toolkit.add_template_directory(config, 'templates')
        toolkit.add_resource('fanstatic', 'mingus')
        return

    plugins.implements(plugins.IRoutes)
    
    def before_map(self, map):
        """
        Called before the routes map is generated. ``before_map`` is before any
        other mappings are created so can override all other mappings.

        :param map: Routes map object
        :returns: Modified version of the map object
        """
        # Positional arguments to map.connect(NAME, URL)
        map.connect(
            'mingus_querybuilder', '/mingus/',
            controller='ckanext.mingus.plugin:MingusController',
            action='mingus')
        return map

    def after_map(self, map):
        """
        Called after routes map is set up. ``after_map`` can be used to
        add fall-back handlers.

        :param map: Routes map object
        :returns: Modified version of the map object
        """
        return map
    

class MingusController(toolkit.BaseController):
    """
    This is the pylons controller for routes in our plugin ! 
    """
    def mingus(self):
        return base.render('index.html')
