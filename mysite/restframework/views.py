from rest_framework import viewsets, permissions
from .models import Course, Student, YearLevel
from .serializers import StudentSerializer, CourseSerializer, YearLevelSerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class YearLevelViewSet(viewsets.ModelViewSet):
    queryset = YearLevel.objects.all()
    serializer_class = YearLevelSerializer