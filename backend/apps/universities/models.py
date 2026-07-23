from django.db import models
from apps.common.models import BaseModel

class University(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Building(BaseModel):
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='buildings')
    name = models.CharField(max_length=150)

    class Meta:
        unique_together = ('university', 'name')

    def __str__(self):
        return f"{self.name} ({self.university.code})"

class Block(BaseModel):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='blocks')
    name = models.CharField(max_length=150)

    class Meta:
        unique_together = ('building', 'name')

    def __str__(self):
        return f"{self.building.name} - {self.name}"
