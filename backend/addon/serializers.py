from rest_framework import serializers
from .models import ConfigSettings, Tax


class ConfigSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigSettings
        fields = '__all__'


class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = '__all__'
