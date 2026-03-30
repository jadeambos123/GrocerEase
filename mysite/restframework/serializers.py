from rest_framework import serializers
from .models import Student, Course, YearLevel

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class YearLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = YearLevel
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    # These "source" fields let React see the nested names (Read-Only)
    course_details = CourseSerializer(source='course', read_only=True)
    year_level_details = YearLevelSerializer(source='year_level', read_only=True)

    class Meta:
        model = Student
        # We include both the ID fields (for saving) and the detail fields (for viewing)
        fields = [
            'student_id', 
            'Fullname', 
            'age', 
            'year_level', 
            'course', 
            'course_details', 
            'year_level_details'
        ]