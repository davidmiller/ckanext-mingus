from setuptools import setup, find_packages
import sys, os

version = '0.1'

setup(
    name='ckanext-mingus',
    version=version,
    description="CKAN Extension for querying and dynamically creating derived datasets",
    long_description='''
    ''',
    classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
    keywords='',
    author='David Miller',
    author_email='david@deadpansincerity.com',
    url='https://github.com/davidmiller/ckanext-mingus',
    license='AGPL',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=['ckanext', 'ckanext.mingus'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        # -*- Extra requirements: -*-
    ],
    entry_points='''
        [ckan.plugins]
        # Add plugins here, e.g.
        mingus=ckanext.mingus.plugin:MingusPlugin
    ''',
)
