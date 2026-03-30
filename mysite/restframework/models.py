from django.db import models

class Student(models.Model):
    student_id = models.AutoField(unique=True,primary_key=True)
    Fullname = models.CharField(max_length=100, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    year_level = models.ForeignKey('YearLevel', on_delete=models.CASCADE, null=True, blank=True)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, null=True, blank=True)

class Course(models.Model):
    course_id = models.AutoField(unique=True,primary_key=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    units = models.IntegerField(null=True, blank=True)

class YearLevel(models.Model):
    year_level_id = models.AutoField(unique=True,primary_key=True)
    name = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.year_level_id})"
