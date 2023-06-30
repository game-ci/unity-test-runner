using UnityEngine;
using System.Collections;
using UnityEditor;

[CustomEditor(typeof(TimerComponent))]
public class LevelScriptEditor : Editor
{
  public override void OnInspectorGUI()
  {
    TimerComponent myTarget = (TimerComponent)target;

    EditorGUILayout.LabelField("Timer", myTarget.Timer.ToString());
  }
}

