import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Users } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { dataProvider } from '../services';
import { Program } from '../types';

interface ProgramDetailProps {
  program: Program;
  onBack: () => void;
}

const statusColors: Record<Program['status'], string> = {
  draft: '#73848A',
  pending_approval: '#AF741A',
  active: '#2D766D',
  pending_audit: '#4B71A4',
  pending_admin_review: '#4B71A4',
  completed: '#397A61',
  cancelled: '#B84C4C',
};

export const ProgramDetail: React.FC<ProgramDetailProps> = ({ program: initialProgram, onBack }) => {
  const [program, setProgram] = useState(initialProgram);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataProvider.getProgramById(initialProgram.id)
      .then(detail => { if (detail) setProgram(detail); })
      .catch(error => Toast.show({ type: 'error', text1: 'Unable to load program details', text2: error?.message || 'Try again.' }))
      .finally(() => setLoading(false));
  }, [initialProgram.id]);

  const members = program.teamMembers || [];
  const status = program.status.replace('_', ' ').toUpperCase();

  return (
    <ScrollView className="flex-1 bg-[#F4F6F7]" contentContainerClassName="pb-12">
      <View className="mx-auto w-full max-w-[1180px] px-5 py-6 md:px-10 md:py-9">
        <TouchableOpacity onPress={onBack} className="mb-7 flex-row items-center gap-2 self-start">
          <View className="rounded-lg border border-[#D7E1E4] bg-white p-2"><ArrowLeft size={17} color={Colors.primary} /></View>
          <Text className="text-sm font-bold text-[#294D55]">Back to workspace</Text>
        </TouchableOpacity>

        <View className="mb-6 flex-row flex-wrap items-start justify-between gap-5">
          <View className="min-w-0 flex-1">
            <Text className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[#2D766D]">PROGRAM / FIELD DETAIL</Text>
            <Text className="text-3xl font-black tracking-[-1px] text-[#152A35] md:text-4xl">{program.programName}</Text>
            <View className="mt-3 flex-row items-center gap-2"><MapPin size={15} color="#71838A" /><Text className="text-sm text-[#71838A]">{program.hatcheryOrFarmName}</Text></View>
          </View>
          <View className="rounded-lg border px-3 py-2" style={{ borderColor: `${statusColors[program.status]}40`, backgroundColor: `${statusColors[program.status]}12` }}>
            <Text className="text-[11px] font-black tracking-wide" style={{ color: statusColors[program.status] }}>{status}</Text>
          </View>
        </View>

        <View className="mb-5 flex-row flex-wrap gap-3">
          <DetailMetric icon={<Users size={17} color="#2D766D" />} label="Flock size" value={`${program.flockSize.toLocaleString()} birds`} />
          <DetailMetric icon={<CalendarDays size={17} color="#4B71A4" />} label="Schedule" value={program.scheduledStartDate} />
          <DetailMetric icon={<Clock3 size={17} color="#AF741A" />} label="Window" value={`${program.scheduledStartTime} - ${program.scheduledEndTime}`} />
        </View>

        <View className="flex-row flex-wrap items-start gap-5">
          <View className="min-w-0 flex-1 gap-5 md:min-w-[520px]">
            <View className="rounded-2xl border border-[#DCE4E7] bg-white p-5 md:p-6">
              <View className="mb-5 flex-row items-center gap-3"><View className="rounded-lg bg-[#EFF5F3] p-2"><Users size={18} color="#2D766D" /></View><View><Text className="text-base font-black text-[#152A35]">Assigned team</Text><Text className="mt-1 text-xs text-[#8A989C]">{members.length} people assigned to this program</Text></View></View>
              {loading ? <ActivityIndicator color={Colors.primary} /> : members.length === 0 ? <Text className="py-8 text-center text-sm text-[#8A989C]">No team members are assigned.</Text> : members.map(member => (
                <View key={member.id} className="flex-row items-center gap-3 border-t border-[#EDF0F1] py-3.5">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-[#DFF0EA]"><Text className="text-xs font-black text-[#2D766D]">{member.fullName.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</Text></View>
                  <View className="min-w-0 flex-1"><Text className="text-sm font-bold text-[#29434D]">{member.fullName}</Text><Text className="mt-0.5 text-xs text-[#8A989C]">{member.employeeCode || member.email}</Text></View>
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-[#71838A]">{member.role.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
            <View className="rounded-2xl border border-[#DCE4E7] bg-white p-5 md:p-6">
              <Text className="mb-4 text-base font-black text-[#152A35]">Program notes</Text>
              <Text className="text-sm leading-6 text-[#71838A]">{program.controllerRemarks || 'No operational notes have been added to this program.'}</Text>
            </View>
          </View>
          <View className="w-full gap-5 md:w-[340px]">
            <View className="rounded-2xl bg-[#152A35] p-5"><View className="mb-5 flex-row items-center gap-2"><ShieldCheck size={18} color="#8FE2BE" /><Text className="text-xs font-bold text-[#B9D8D5]">PROGRAM CONTROL</Text></View><Text className="text-xs text-[#8FA8AC]">CONTROLLER</Text><Text className="mt-1 text-sm font-bold text-white">{program.controllerName || 'Unassigned'}</Text><Text className="mt-5 text-xs text-[#8FA8AC]">AUDITOR</Text><Text className="mt-1 text-sm font-bold text-white">{program.auditorName || 'Not assigned'}</Text></View>
            <View className="rounded-2xl border border-[#DCE4E7] bg-white p-5"><View className="mb-4 flex-row items-center gap-2"><CheckCircle2 size={17} color="#397A61" /><Text className="text-sm font-black text-[#152A35]">Vaccines</Text></View>{(program.vaccinesUsed || ['Not specified']).map(vaccine => <Text key={vaccine} className="border-t border-[#EDF0F1] py-3 text-sm text-[#71838A]">{vaccine}</Text>)}</View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const DetailMetric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View className="min-w-[180px] flex-1 rounded-xl border border-[#DCE4E7] bg-white p-4"><View className="mb-3">{icon}</View><Text className="text-[11px] font-bold uppercase tracking-wide text-[#8A989C]">{label}</Text><Text className="mt-1 text-sm font-black text-[#29434D]">{value}</Text></View>
);
